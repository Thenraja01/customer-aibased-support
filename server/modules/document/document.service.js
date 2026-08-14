import Document from "./document.schema.js";
import DocumentChunk from "./documentChunk.schema.js";
import DocumentVersion from "../document-version/documentVersion.schema.js";
import DocumentRoleAccess from "./documentRoleAccess.schema.js";
import DocumentVerification from "../document-verification/documentVerification.schema.js";
import { ingestDocument } from "../rag/rag.service.js";
import { extractTextFromBuffer } from "../../utils/extractText.utils.js";
import { uploadToCloudinary, deleteFromCloudinary, downloadFromCloudinary, generateSignedUrl } from "../../services/cloudinary.service.js";
import { normalizeRoleName, isNormalizedAdminRole } from "../../utils/constants.js";
import mongoose from "mongoose";
import { invalidateQuickActionCache } from "../chat/quickAction.service.js";
import { ingestDocumentGraph } from "../../services/mongodbGraph.service.js";

// Helper to normalize and match user roles against allowed roles
const matchRoles = (userRole, allowedRoles) => {
  const normUser = userRole.toLowerCase().replace(/[\s_]+/g, "");
  return allowedRoles.some((role) => role.toLowerCase().replace(/[\s_]+/g, "") === normUser);
};

import { enqueueJob } from "../ai/ai.service.js";

export const startBackgroundProcessing = async (documentId, versionId) => {
  try {
    const job = await enqueueJob({
      job_type: "document_ingest",
      payload: { documentId, versionId },
      priority: 10,
    });
    console.log(`[BackgroundProcessing] Enqueued document_ingest job for doc ${documentId}`);
    return job;
  } catch (err) {
    // Never leave a document silently stuck in "queued" with no job behind it.
    console.error(`[BackgroundProcessing] Failed to enqueue for doc ${documentId}, version ${versionId}:`, err.message);
    await Document.updateOne(
      { _id: documentId },
      {
        ingestionStatus: "failed",
        indexingStatus: "failed",
        knowledge_index_status: "failed",
        ingestion_error: `Failed to enqueue background processing: ${err.message}`,
        failed_stage: "enqueue",
      }
    ).catch(() => null);
    return null;
  }
};

export const retryDocumentIngestion = async (documentId, orgId = null, branchId = null) => {
  const query = { _id: documentId };
  if (orgId) query.organization_id = orgId;
  if (branchId) query.branch_id = branchId;
  const doc = await Document.findOne(query);
  if (!doc) throw new Error("Document not found");

  const versionId = doc.currentVersionId || doc.file_id;
  if (!versionId) throw new Error("Document version ID missing for ingestion retry");

  doc.status = "uploaded";
  doc.ingestionStatus = "queued";
  doc.knowledge_index_status = "queued";
  doc.ingestion_error = null;
  await doc.save();

  const job = await startBackgroundProcessing(doc._id, versionId);
  if (!job) throw new Error("Failed to enqueue background processing for ingestion retry");
  return doc;
};

export const processDocument = async (documentId, versionId) => {
  const doc = await Document.findById(documentId);
  if (!doc) return;

  // Preserve the pre-processing status: a reindex/rebuild of an already
  // published document must not demote it (or its chunks) back to draft.
  const originalStatus = doc.status;
  const wasPublished = originalStatus === "published";

  doc.status = "processing";
  doc.ingestionStatus = "processing";
  doc.knowledge_index_status = "queued";
  await doc.save();

  const version = await DocumentVersion.findById(versionId);
  if (version) {
    version.status = "processing";
    await version.save();
  }

  const markFailed = async (stage, err) => {
    const message = err?.message || "Unknown error";
    doc.status = "needs_revision";
    doc.ingestionStatus = "failed";
    doc.indexingStatus = "failed";
    doc.knowledge_index_status = "failed";
    doc.ingestion_error = message;
    doc.failed_stage = stage;
    doc.retry_count = (doc.retry_count || 0) + 1;
    await doc.save();
    if (version) {
      version.status = "rejected";
      version.changelog += `\nProcessing failed at ${stage}: ${message}`;
      await version.save();
    }
    console.error(`[BackgroundProcessing] Error at ${stage} for doc ${documentId}:`, err);
  };

  try {
    doc.ingestionStatus = "parsing";
    await doc.save();

    // Download secure file buffer from Cloudinary
    const fileBuffer = await downloadFromCloudinary(doc.cloudinary_public_id, doc.cloudinary_resource_type);

    // Extract text
    const text = await extractTextFromBuffer(fileBuffer, doc.file_mimetype);
    if (!text || text.trim().length < 10) {
      doc.ingestionStatus = "failed";
      doc.indexingStatus = "failed";
      doc.knowledge_index_status = "not_ingestible";
      doc.ingestion_error = "No extractable text found in document";
      doc.failed_stage = "extract";
      doc.status = "ready_for_review";
      await doc.save();
      if (version) {
        version.status = "ready_for_review";
        await version.save();
      }
      return;
    }

    doc.ingestionStatus = "chunking";
    await doc.save();

    // Automatically detect topics for the document
    doc.topicStatus = "detecting";
    await doc.save();
    let detectedTopicIds = [];
    try {
      const { detectTopicsForText } = await import("./documentTopicDetection.js");
      detectedTopicIds = await detectTopicsForText(text, doc.organization_id);
      doc.topics = detectedTopicIds;
      doc.topicStatus = detectedTopicIds.length > 0 ? "detected" : "failed";
    } catch (err) {
      doc.topicStatus = "failed";
      console.error("[TopicDetection] Failed:", err.message);
    }

    // Chunk and ingest into vector store
    doc.ingestionStatus = "embedding";
    doc.indexingStatus = "indexing";
    doc.knowledge_index_status = "indexing";
    await doc.save();

    // Remove stale DB chunks for THIS version
    await DocumentChunk.deleteMany({ document_id: documentId, documentVersionId: versionId });

    // Idempotent: processDocument always re-ingests the CURRENT version's text.
    const savedChunks = await ingestDocument(
      documentId,
      doc.organization_id,
      doc.branch_id,
      doc.assigned_role || "all",
      text,
      "ready_for_review",
      doc.visibility || (doc.branch_id ? "branch" : "organization"),
      doc.accessPolicy?.customerVisible || false,
      doc.allowed_roles,
      versionId,
      detectedTopicIds // topics
    );

    doc.chunk_count = savedChunks.length;
    doc.embedded_chunk_count = savedChunks.filter((c) => c.embedding && c.embedding.length > 0).length;
    doc.indexed_chunk_count = savedChunks.length;
    doc.indexingStatus = "indexed";
    doc.ingestionStatus = "completed";
    doc.knowledge_index_status = "indexed";
    doc.graphStatus = "built";
    doc.ingestion_error = null;
    doc.failed_stage = null;
    doc.last_indexed_at = new Date();
    doc.status = wasPublished ? "published" : "ready_for_review";
    await doc.save();

    if (wasPublished) {
      // Flip this version's chunks (plus any legacy version-less chunks that were
      // ingested before versioning existed) back to published, and retire any
      // superseded non-current versions.
      await DocumentChunk.updateMany(
        { document_id: documentId, $or: [{ documentVersionId: versionId }, { documentVersionId: null }] },
        { status: "published" }
      );
      await DocumentChunk.updateMany(
        { document_id: documentId, documentVersionId: { $nin: [versionId, null] } },
        { status: "archived" }
      );
    }

    if (version) {
      version.status = wasPublished ? "published" : "ready_for_review";
      await version.save();
    }
    console.log(`[BackgroundProcessing] Successfully processed doc ${documentId} (${savedChunks.length} chunks)`);
  } catch (err) {
    await markFailed("ingest", err);
  }
};

export const createDocument = async (data, userId, fileBuffer, fileName, fileMimeType, isAdmin = false) => {
  const documentId = new mongoose.Types.ObjectId();
  const versionId = new mongoose.Types.ObjectId();
  const versionNumber = 1;

  // Determine resource type
  let resourceType = "raw";
  if (fileMimeType.startsWith("image/")) {
    resourceType = "image";
  } else if (fileMimeType.startsWith("video/")) {
    resourceType = "video";
  }

  // Construct public ID
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const branchPath = data.branch_id ? `branches/${data.branch_id}` : "organization-wide";
  const publicId = `organizations/${data.organization_id}/${branchPath}/documents/${documentId}/v${versionNumber}/${sanitizedFileName}`;

  // Upload to Cloudinary
  const uploadResult = await uploadToCloudinary(fileBuffer, publicId, resourceType);

  const docStatus = "uploaded"; // Always start as uploaded for background processing

  const doc = await Document.create({
    _id: documentId,
    ...data,
    branch_id: data.branch_id || null,
    status: docStatus,
    verification_status: isAdmin ? "approved" : "pending",
    knowledge_index_status: "queued",
    ingestionStatus: "queued",
    indexingStatus: "idle",
    graphStatus: "idle",
    topicStatus: "idle",
    file_id: versionId,
    file_name: fileName,
    file_mimetype: fileMimeType,
    file_size: uploadResult.bytes || fileBuffer.length,
    allowed_roles: data.allowed_roles || ["admin", "branch_admin", "support"],
    cloudinary_public_id: uploadResult.public_id,
    cloudinary_resource_type: resourceType,
    cloudinary_version: String(uploadResult.version),
    cloudinary_format: uploadResult.format,
  });

  // Create DocumentVersion
  await DocumentVersion.create({
    _id: versionId,
    document_id: documentId,
    organization_id: data.organization_id,
    branch_id: data.branch_id || null,
    version_number: versionNumber,
    file_id: versionId,
    file_name: fileName,
    file_mimetype: fileMimeType,
    file_size: uploadResult.bytes || fileBuffer.length,
    uploadedBy: userId,
    status: docStatus,
    allowed_roles: data.allowed_roles || ["admin", "branch_admin", "support"],
    cloudinary_public_id: uploadResult.public_id,
    cloudinary_resource_type: resourceType,
    cloudinary_version: String(uploadResult.version),
    cloudinary_format: uploadResult.format,
    changelog: "Initial upload",
  });

  doc.currentVersionId = versionId;
  await doc.save();

  if (data.role_ids && Array.isArray(data.role_ids)) {
    const roleAccessEntries = data.role_ids.map((roleId) => ({
      document_id: doc._id,
      role_id: roleId,
      organization_id: doc.organization_id,
    }));
    await DocumentRoleAccess.insertMany(roleAccessEntries);
  }

  // Create verification entry: admin uploads self-approve, branch_admin/staff uploads wait for admin review
  await DocumentVerification.create({
    document_id: doc._id,
    verified_by: userId,
    status: isAdmin ? "approved" : "pending",
  });

  // Start background processing
  startBackgroundProcessing(documentId, versionId);

  return doc;
};

export const uploadNewVersion = async (documentId, userId, orgId, branchId, userRole, fileBuffer, fileName, fileMimeType, changelog) => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error("Document not found");

  // Multi-tenant check
  if (doc.organization_id.toString() !== orgId.toString()) {
    throw new Error("Forbidden: Document belongs to another organization");
  }

  // Branch check
  const normalizedRole = normalizeRoleName(userRole);
  const isAdmin = isNormalizedAdminRole(normalizedRole) || normalizedRole === "super_admin";
  if (!isAdmin && doc.branch_id && doc.branch_id.toString() !== branchId?.toString()) {
    throw new Error("Forbidden: Document belongs to another branch");
  }

  const nextVersionNumber = (doc.version_number || 1) + 1;
  const versionId = new mongoose.Types.ObjectId();

  // Determine resource type
  let resourceType = "raw";
  if (fileMimeType.startsWith("image/")) {
    resourceType = "image";
  } else if (fileMimeType.startsWith("video/")) {
    resourceType = "video";
  }

  // Construct public ID
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const branchPath = doc.branch_id ? `branches/${doc.branch_id}` : "organization-wide";
  const publicId = `organizations/${orgId}/${branchPath}/documents/${documentId}/v${nextVersionNumber}/${sanitizedFileName}`;

  // Upload to Cloudinary
  const uploadResult = await uploadToCloudinary(fileBuffer, publicId, resourceType);

  // Update Document metadata (keep old allowed_roles, status transitions to "uploaded")
  doc.status = "uploaded";
  doc.version_number = nextVersionNumber;
  doc.file_name = fileName;
  doc.file_mimetype = fileMimeType;
  doc.file_size = uploadResult.bytes || fileBuffer.length;
  doc.cloudinary_public_id = uploadResult.public_id;
  doc.cloudinary_resource_type = resourceType;
  doc.cloudinary_version = String(uploadResult.version);
  doc.cloudinary_format = uploadResult.format;
  doc.currentVersionId = versionId;
  await doc.save();

  // Create DocumentVersion
  await DocumentVersion.create({
    _id: versionId,
    document_id: documentId,
    organization_id: orgId,
    branch_id: doc.branch_id || null,
    version_number: nextVersionNumber,
    file_id: versionId,
    file_name: fileName,
    file_mimetype: fileMimeType,
    file_size: uploadResult.bytes || fileBuffer.length,
    uploadedBy: userId,
    status: "uploaded",
    allowed_roles: doc.allowed_roles,
    cloudinary_public_id: uploadResult.public_id,
    cloudinary_resource_type: resourceType,
    cloudinary_version: String(uploadResult.version),
    cloudinary_format: uploadResult.format,
    changelog,
  });

  startBackgroundProcessing(documentId, versionId);

  return doc;
};

export const getDocumentForViewing = async (documentId, user) => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error("Document not found");

  const userOrgId = user.organizationId || user.organization_id?._id || user.organization_id;
  const userBranchId = user.branchId || user.branch_id;
  const userRole = user.role || user.roleName;

  // 1. Verify organization_id
  if (doc.organization_id.toString() !== userOrgId?.toString()) {
    throw new Error("Forbidden: Document belongs to another organization");
  }

  const normalizedRole = normalizeRoleName(userRole);
  const isSuperAdmin = normalizedRole === "super_admin";
  const isAdmin = normalizedRole === "admin";
  const isBranchAdmin = normalizedRole === "branch_admin";

  // 2. Verify branch scope
  if (!isSuperAdmin && !isAdmin) {
    if (doc.branch_id && doc.branch_id.toString() !== userBranchId?.toString()) {
      throw new Error("Forbidden: Document belongs to another branch");
    }
  }

  // 3. Verify allowed_roles
  if (!isSuperAdmin && !isAdmin && !isBranchAdmin) {
    const allowed = doc.allowed_roles || ["admin", "branch_admin", "support"];
    if (!matchRoles(userRole, allowed)) {
      throw new Error("Forbidden: Your role does not have permission to view this document");
    }
  }

  // 4. Verify document status
  if (!isSuperAdmin && !isAdmin && !isBranchAdmin) {
    if (doc.status !== "published" && doc.status !== "approved") {
      throw new Error("Forbidden: Document is not published");
    }
  }

  if (!doc.cloudinary_public_id) {
    throw new Error("Document storage error: No Cloudinary public ID found");
  }

  return doc;
};

export const downloadDocument = async (documentId, user) => {
  const doc = await getDocumentForViewing(documentId, user);
  const buffer = await downloadFromCloudinary(doc.cloudinary_public_id, doc.cloudinary_resource_type);
  return { buffer, contentType: doc.file_mimetype || "application/pdf" };
};


export const getAllDocuments = async (organizationId = null, branchId = null, page = 1, limit = 20, status = "", search = "") => {
  const filter = {};
  if (organizationId) filter.organization_id = organizationId;
  if (branchId) filter.branch_id = branchId;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Document.find(filter)
      .populate("user_id", "name email")
      .populate("document_type_id", "name")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit),
    Document.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getDocumentById = async (id) => {
  const doc = await Document.findById(id)
    .populate("user_id", "name email")
    .populate("document_type_id", "name");
  if (!doc) throw new Error("Document not found");
  return doc;
};

export const getDocumentsByUser = async (userId, roleName = null, roleId = null, organizationId = null) => {
  const normalizedRole = normalizeRoleName(roleName);
  const isAdmin = isNormalizedAdminRole(normalizedRole);

  if (isAdmin && organizationId) {
    return await Document.find({ organization_id: organizationId }).sort({ created_at: -1 });
  }

  const userDocs = await Document.find({ user_id: userId }).sort({ created_at: -1 });

  if (roleId && organizationId) {
    const accessEntries = await DocumentRoleAccess.find({
      organization_id: organizationId,
      role_id: roleId,
    }).select("document_id").lean();
    const accessibleIds = new Set(accessEntries.map((e) => e.document_id.toString()));

    const roleMatchDocs = await Document.find({
      organization_id: organizationId,
      assigned_role: { $in: [normalizedRole, "all"] },
    }).lean();
    roleMatchDocs.forEach((d) => accessibleIds.add(d._id.toString()));

    const merged = userDocs.filter((d) => accessibleIds.has(d._id.toString()));
    const extra = await Document.find({
      _id: { $in: [...accessibleIds] },
      organization_id: organizationId,
    }).sort({ created_at: -1 }).lean();

    const seen = new Set(merged.map((d) => d._id.toString()));
    extra.forEach((d) => {
      if (!seen.has(d._id.toString())) merged.push(d);
    });
    return merged;
  }

  return userDocs;
};

export const getDocumentsByStatus = async (status, organizationId = null) => {
  const filter = { status };
  if (organizationId) filter.organization_id = organizationId;
  return await Document.find(filter)
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const updateDocumentStatus = async (id, updateData) => {
  const doc = await Document.findByIdAndUpdate(id, updateData, { new: true });
  if (!doc) throw new Error("Document not found");

  const chunkUpdate = {};
  if (updateData.status) chunkUpdate.status = updateData.status;
  if (updateData.assigned_role) chunkUpdate.assigned_role = updateData.assigned_role.toLowerCase();
  if (Object.keys(chunkUpdate).length > 0) {
    await DocumentChunk.updateMany({ document_id: id }, chunkUpdate);
  }

  if (updateData.status && doc.currentVersionId) {
    await DocumentVersion.findByIdAndUpdate(doc.currentVersionId, { status: updateData.status });
  }

  return doc;
};

export const approveDocument = async (id, userId) => {
  const now = new Date();
  const doc = await Document.findByIdAndUpdate(
    id,
    { status: "approved", approved_by: userId, approved_at: now, verification_status: "approved", verified_by: userId, verified_at: now },
    { new: true }
  ).populate("document_type_id");
  if (!doc) throw new Error("Document not found");

  if (doc.currentVersionId) {
    await DocumentVersion.findByIdAndUpdate(doc.currentVersionId, { status: "approved" });
  }

  await DocumentVerification.findOneAndUpdate(
    { document_id: id },
    { status: "approved", verified_by: userId },
    { upsert: true, new: true }
  );
  await DocumentChunk.updateMany(
    { document_id: id },
    { status: "approved", assigned_role: (doc.assigned_role || "all").toLowerCase() }
  );

  if (doc.currentVersionId) {
    await startBackgroundProcessing(doc._id, doc.currentVersionId);
  }

  return doc;
};

export const publishDocument = async (id, userId) => {
  const now = new Date();
  const doc = await Document.findByIdAndUpdate(
    id,
    { status: "published", approved_by: userId, approved_at: now, published_at: now, verification_status: "approved", verified_by: userId, verified_at: now },
    { new: true }
  ).populate("document_type_id");
  if (!doc) throw new Error("Document not found");

  if (doc.currentVersionId) {
    await DocumentVersion.findByIdAndUpdate(doc.currentVersionId, { status: "published" });
  }

  await DocumentVerification.findOneAndUpdate(
    { document_id: id },
    { status: "approved", verified_by: userId },
    { upsert: true, new: true }
  );
  // Publish current-version chunks (and legacy version-less chunks ingested before
  // versioning existed) so published docs always have retrievable, counted chunks.
  await DocumentChunk.updateMany(
    { document_id: id, $or: [{ documentVersionId: doc.currentVersionId }, { documentVersionId: null }] },
    { status: "published", assigned_role: (doc.assigned_role || "all").toLowerCase() }
  );
  // Retire superseded versions once the new version goes live. They stayed
  // retrievable during the approval window but must not compete afterwards.
  await DocumentChunk.updateMany(
    { document_id: id, documentVersionId: { $nin: [doc.currentVersionId, null] } },
    { status: "archived" }
  );
  return doc;
};

export const rejectDocument = async (id, userId, remarks) => {
  const doc = await Document.findByIdAndUpdate(
    id,
    { status: "rejected", rejection_reason: remarks || "", verification_status: "rejected", verified_by: userId, verified_at: new Date() },
    { new: true }
  );
  if (!doc) throw new Error("Document not found");

  if (doc.currentVersionId) {
    await DocumentVersion.findByIdAndUpdate(doc.currentVersionId, { status: "rejected" });
  }

  await DocumentVerification.findOneAndUpdate(
    { document_id: id },
    { status: "rejected", verified_by: userId, remarks: remarks || "" },
    { upsert: true, new: true }
  );
  await DocumentChunk.updateMany(
    { document_id: id },
    { status: "rejected", assigned_role: (doc.assigned_role || "all").toLowerCase() }
  );
  return doc;
};

export const deleteDocument = async (id) => {
  const doc = await Document.findById(id);
  if (!doc) throw new Error("Document not found");

  // Get all versions to delete their Cloudinary assets
  const versions = await DocumentVersion.find({ document_id: id }).lean();
  for (const ver of versions) {
    if (ver.cloudinary_public_id) {
      await deleteFromCloudinary(ver.cloudinary_public_id, ver.cloudinary_resource_type).catch((err) => {
        console.error(`Failed to delete Cloudinary asset ${ver.cloudinary_public_id}:`, err.message);
      });
    }
  }

  // Delete from DB
  await Promise.all([
    Document.findByIdAndDelete(id),
    DocumentVersion.deleteMany({ document_id: id }),
    DocumentChunk.deleteMany({ document_id: id }),
    DocumentRoleAccess.deleteMany({ document_id: id }),
    DocumentVerification.deleteMany({ document_id: id }),
  ]);

  if (doc.organization_id) {
    await invalidateQuickActionCache(doc.organization_id);
  }

  return { message: "Document and related data deleted" };
};

export const setDocumentRoleAccess = async (documentId, roleIds, organizationId) => {
  await DocumentRoleAccess.deleteMany({ document_id: documentId });
  if (roleIds && roleIds.length > 0) {
    const entries = roleIds.map((roleId) => ({
      document_id: documentId,
      role_id: roleId,
      organization_id: organizationId,
    }));
    await DocumentRoleAccess.insertMany(entries);
  }
};

export const getDocumentRoleAccess = async (documentId) => {
  const entries = await DocumentRoleAccess.find({ document_id: documentId })
    .populate("role_id", "role_name")
    .lean();
  return entries.map((e) => e.role_id);
};
