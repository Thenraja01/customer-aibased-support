import fs from "fs";
import path from "path";
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
import { logger } from "../../utils/logger.js";

export const startBackgroundProcessing = async (documentId, versionId) => {
  try {
    const job = await enqueueJob({
      job_type: "document_ingest",
      payload: { documentId, versionId },
      priority: 10,
    });
    logger.info("DocIngestion", `Enqueued document_ingest job for doc ${documentId}`);
    return job;
  } catch (err) { logger.error("DocIngestion", `Failed to enqueue for doc ${documentId}, version ${versionId}: ${err.message}`, err);
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

export const abortDocumentProcessing = async (documentId, orgId = null, branchId = null) => {
  const query = { _id: documentId };
  if (orgId) query.organization_id = orgId;
  if (branchId) query.branch_id = branchId;
  const doc = await Document.findOne(query);
  if (!doc) throw new Error("Document not found");

  doc.status = "needs_revision";
  doc.ingestionStatus = "failed";
  doc.indexingStatus = "failed";
  doc.knowledge_index_status = "failed";
  doc.ingestion_error = "Ingestion processing was manually aborted by administrator.";
  doc.failed_stage = "user_aborted";
  await doc.save();

  if (doc.currentVersionId) {
    await DocumentVersion.findByIdAndUpdate(doc.currentVersionId, {
      status: "needs_revision",
      changelog: "Processing manually aborted by admin",
    }).catch(() => null);
  }
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

    try {
      const { notifyAdminsOnSystemError } = await import("../notification/notification.service.js");
      await notifyAdminsOnSystemError({
        organizationId: doc.organization_id,
        title: `Document Ingestion Alert: ${doc.title || "Document"}`,
        message: `Processing failed at stage "${stage}": ${message}`,
        type: "error",
        link: "/admin/knowledge",
      });
    } catch {
      // non-fatal notification fallback
    }
  };

  const emitProgress = (stage, percent, message, extra = {}) => {
    import("../../config/socket.js").then(({ getIO }) => {
      try {
        const io = getIO();
        if (io) {
          const payload = {
            documentId: doc._id.toString(),
            stage,
            percent,
            message,
            chunk_count: doc.chunk_count || 0,
            status: doc.status,
            knowledge_index_status: stage === "completed" ? "indexed" : doc.knowledge_index_status,
            ...extra,
          };
          io.emit("document:progress", payload);
          if (doc.organization_id) {
            io.to(`org:${doc.organization_id}`).emit("document:progress", payload);
          }
        }
      } catch {
        // non-fatal socket broadcast
      }
    }).catch(() => null);
  };

  try {
    doc.ingestionStatus = "parsing";
    await doc.save();
    emitProgress("parsing", 20, "Extracting text content...");

    // Download secure file buffer from Cloudinary or local fallback
    let fileBuffer = Buffer.from("");
    if (doc.cloudinary_public_id) {
      try {
        fileBuffer = await downloadFromCloudinary(doc.cloudinary_public_id, doc.cloudinary_resource_type, {
          organizationId: doc.organization_id,
          branchId: doc.branch_id,
        });
      } catch (err) {
        console.warn(`[Download] Cloudinary download warning:`, err.message);
      }
    }

    if ((!fileBuffer || fileBuffer.length === 0) && doc.file_name) {
      const localPaths = [
        path.resolve("uploads", doc.file_name),
        path.resolve("../uploads", doc.file_name),
        path.resolve("docs", doc.file_name),
        path.resolve("../docs", doc.file_name),
        path.resolve("docs/knowledge_base", doc.file_name),
        path.resolve("../docs/knowledge_base", doc.file_name),
        path.resolve("../../docs/knowledge_base", doc.file_name),
      ];
      for (const lp of localPaths) {
        if (fs.existsSync(lp)) {
          fileBuffer = fs.readFileSync(lp);
          break;
        }
      }
    }

    // Extract text with Tier 1/2 parsers
    let text = await extractTextFromBuffer(fileBuffer, doc.file_mimetype, doc.file_name);
    if (!text || text.trim().length < 10) {
      const existingChunks = await DocumentChunk.find({ document_id: documentId }).lean();
      if (existingChunks.length > 0) {
        text = existingChunks.map((c) => c.content || c.text_content).join("\n\n");
      } else if (doc.description && doc.description.trim().length >= 10) {
        text = doc.description.trim();
      }
    }

    // Tier 3 Fallback: Synthesize metadata if file had no text
    if (!text || text.trim().length < 10) {
      const synthetic = `Document Title: ${doc.title}\nDescription: ${doc.description || "General organizational knowledge documentation"}\nFile: ${doc.file_name}`;
      if (synthetic.length >= 10) {
        console.log(`[TextExtraction] Tier 3 metadata synthesis used for doc "${doc.title}"`);
        text = synthetic;
      }
    }

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
    emitProgress("chunking", 40, "Splitting content into semantic chunks...");

    // Automatically detect topics for the document
    doc.topicStatus = "detecting";
    await doc.save();
    emitProgress("topics", 55, "Detecting topics and extracting graph entities...");
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
    emitProgress("embedding", 75, "Generating vector embeddings in ChromaDB...");

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

    // Build Knowledge Graph nodes & extract entity-relation triples (GraphRAG)
    try {
      await ingestDocumentGraph(documentId, doc.organization_id, doc.branch_id, savedChunks, detectedTopicIds);
      doc.graphStatus = "built";
    } catch (graphErr) {
      console.error(`[GraphRAG] Failed to ingest graph for doc ${documentId}:`, graphErr.message);
      doc.graphStatus = "failed";
    }

    // Auto-generate and store AI Context Summary for instant high-speed LLM retrieval
    try {
      const { generateResponse } = await import("../llm/llm.service.js");
      const sampleText = (text || "").slice(0, 4000);
      if (sampleText.trim().length >= 20) {
        const summaryPrompt = `Analyze the following document and provide:
1. A concise 2-3 sentence executive context summary.
2. The core subjects and key topics.

Document: "${doc.title}"
Content:
${sampleText}

Respond directly with the executive summary and key topics.`;

        const summaryResult = await generateResponse(summaryPrompt, "", {
          organizationId: doc.organization_id,
          temperature: 0.3,
          maxTokens: 300,
        });

        const rawSummary = typeof summaryResult === "string" ? summaryResult : summaryResult?.text || "";
        if (rawSummary && rawSummary.trim().length > 0) {
          doc.summary = rawSummary.trim();
          doc.context_summary = rawSummary.trim();
          logger.info("DocSummary", `Generated context summary for doc "${doc.title}"`);
        }
      }
    } catch (sumErr) {
      logger.warn("DocSummary", `Context summary generation warning for doc ${documentId}: ${sumErr.message}`);
    }
   let shouldAutoPublish = wasPublished;
    if (!shouldAutoPublish) {
      if (doc.user_id) {
        try {
          const User = mongoose.model("User");
          const uploader = await User.findById(doc.user_id).populate("role_id").lean();
          const roleName = uploader?.role_id?.name || uploader?.role || "";
          if (isBranchAdminOrAbove(roleName) || !roleName) {
            shouldAutoPublish = true;
          }
        } catch {
          shouldAutoPublish = true;
        }
      } else {
        shouldAutoPublish = true;
      }
    }

    doc.ingestionStatus = "completed";
    doc.knowledge_index_status = "indexed";
    doc.ingestion_error = null;
    doc.failed_stage = null;
    doc.last_indexed_at = new Date();
    doc.status = shouldAutoPublish ? "published" : "ready_for_review";
    await doc.save();

    if (shouldAutoPublish) {
      // Flip chunks to published so they are immediately searchable in RAG
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
      version.status = shouldAutoPublish ? "published" : "ready_for_review";
      await version.save();
    }

    emitProgress("completed", 100, "Ingestion and AI Context Summary complete!");
    logger.success("DocIngestion", `Successfully processed doc ${documentId} (${savedChunks.length} chunks, status: ${doc.status})`);

    // Emit real-time WebSocket event to all admin clients
    try {
      const { getIO } = await import("../../config/socket.js");
      const io = getIO();
      io.emit("document:indexed", {
        documentId: String(documentId),
        title: doc.title,
        chunkCount: savedChunks.length,
        status: doc.status,
      });
    } catch {
      // socket fallback
    }

    // Send in-app notification to the uploader
    if (doc.user_id) {
      try {
        const { createNotification } = await import("../notification/notification.service.js");
        await createNotification({
          user_id: doc.user_id,
          organization_id: doc.organization_id,
          title: "Document Ingestion Complete",
          message: `Document "${doc.title}" (${savedChunks.length} chunks) is now indexed and live in RAG search.`,
          type: "success",
          link: "/admin/documents",
        });
      } catch {
        // notification fallback
      }
    }
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
  const uploadResult = await uploadToCloudinary(fileBuffer, publicId, resourceType, {
    organizationId: data.organization_id,
    branchId: data.branch_id,
  });

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
  const normalizedRole = normalizeRoleName(userRole);
  const isSuperAdmin = normalizedRole === "super_admin";
  const isOrgAdmin = normalizedRole === "admin" || isSuperAdmin;

  if (!isSuperAdmin && orgId && doc.organization_id.toString() !== orgId.toString()) {
    throw new Error("Forbidden: Document belongs to another organization");
  }

  // Branch check: Org admin (and super_admin) can manage all branch documents in their organization
  if (!isOrgAdmin && doc.branch_id && branchId && doc.branch_id.toString() !== branchId.toString()) {
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
  const uploadResult = await uploadToCloudinary(fileBuffer, publicId, resourceType, {
    organizationId: orgId,
    branchId: doc.branch_id,
  });

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
    const isOrgOrPublicVisible =
      doc.visibility === "organization" ||
      doc.visibility === "public" ||
      doc.allowed_roles?.includes("customer") ||
      doc.allowed_roles?.includes("all") ||
      doc.allowed_roles?.includes("public");

    if (doc.branch_id && doc.branch_id.toString() !== userBranchId?.toString() && !isOrgOrPublicVisible) {
      throw new Error("Forbidden: Document belongs to another branch");
    }
  }

  // 3. Verify allowed_roles
  if (!isSuperAdmin && !isAdmin && !isBranchAdmin) {
    const allowed = doc.allowed_roles || ["admin", "branch_admin", "support", "customer", "all", "public"];
    if (!matchRoles(userRole, allowed)) {
      throw new Error("Forbidden: Your role does not have permission to view this document");
    }
  }

  // 4. Verify document status
  if (!isSuperAdmin && !isAdmin && !isBranchAdmin) {
    const validStatuses = ["published", "approved", "ready_for_review", "uploaded", "completed"];
    if (!validStatuses.includes(doc.status)) {
      throw new Error("Forbidden: Document is not published");
    }
  }

  return doc;
};

export const downloadDocument = async (documentId, user) => {
  const doc = await getDocumentForViewing(documentId, user);
  const buffer = await downloadFromCloudinary(doc.cloudinary_public_id, doc.cloudinary_resource_type, {
    organizationId: doc.organization_id,
    branchId: doc.branch_id,
  });
  return { buffer, contentType: doc.file_mimetype || "application/pdf" };
};


export const getAllDocuments = async (organizationId = null, branchId = null, page = 1, limit = 20, status = "", search = "", userRole = null) => {
  const filter = {};
  if (organizationId) filter.organization_id = organizationId;
  if (branchId) {
    filter.branch_id = { $in: [branchId, null] };
  }
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  if (userRole) {
    const normalizedRole = normalizeRoleName(userRole);
    const isAdmin = isNormalizedAdminRole(normalizedRole) || normalizedRole === "super_admin";
    if (!isAdmin) {
      filter.allowed_roles = { $in: [normalizedRole, "all", "public"] };
    }
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

  if (organizationId) {
    const accessibleIds = new Set();

    if (roleId && mongoose.isValidObjectId(roleId)) {
      const accessEntries = await DocumentRoleAccess.find({
        organization_id: organizationId,
        role_id: roleId,
      }).select("document_id").lean();
      accessEntries.forEach((e) => {
        if (e.document_id) accessibleIds.add(e.document_id.toString());
      });
    }

    const roleMatchDocs = await Document.find({
      organization_id: organizationId,
      $or: [
        { assigned_role: { $in: [normalizedRole, "all", "customer"] } },
        { allowed_roles: { $in: [normalizedRole, "all", "customer", "public"] } }
      ]
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

export const updateDocumentMetadata = async (id, metadata, orgId, branchId) => {
  const query = { _id: id, organization_id: orgId };
  if (branchId) query.branch_id = branchId;

  const updateFields = {};
  if (metadata.title !== undefined) updateFields.title = metadata.title;
  if (metadata.description !== undefined) updateFields.description = metadata.description;
  if (metadata.document_type !== undefined) updateFields.document_type = metadata.document_type;
  if (metadata.visibility !== undefined) updateFields.visibility = metadata.visibility;
  if (metadata.tags !== undefined) updateFields.tags = metadata.tags;
  
  if (metadata.branch_id !== undefined) {
    updateFields.branch_id = (metadata.branch_id === "all" || metadata.branch_id === "ALL" || !metadata.branch_id) ? null : metadata.branch_id;
  }
  
  if (metadata.allowed_roles !== undefined) {
    let roles = metadata.allowed_roles;
    if (typeof roles === "string") {
      try { roles = JSON.parse(roles); } catch { roles = roles.split(",").map((r) => r.trim()).filter(Boolean); }
    }
    updateFields.allowed_roles = roles.map(normalizeRoleName).filter(Boolean);
  }

  const doc = await Document.findOneAndUpdate(query, { $set: updateFields }, { new: true }).lean();
  if (!doc) throw new Error("Document not found");

  // Sync updated branch_id & allowed_roles down to all DocumentChunks for RAG
  const chunkUpdate = {};
  if (updateFields.branch_id !== undefined) chunkUpdate.branch_id = updateFields.branch_id;
  if (updateFields.allowed_roles !== undefined) chunkUpdate.allowedRoles = updateFields.allowed_roles;

  if (Object.keys(chunkUpdate).length > 0) {
    await DocumentChunk.updateMany({ document_id: id }, { $set: chunkUpdate });
  }

  // Invalidate RAG prompt response cache for this organization
  const { invalidateOrgResponseCache } = await import("../../services/promptCache.service.js");
  await invalidateOrgResponseCache(orgId).catch(() => null);

  return doc;
};

export const updateDocumentStatus = async (id, updateData, orgId, branchId) => {
  const query = { _id: id, organization_id: orgId };
  if (branchId) query.branch_id = branchId;
  const doc = await Document.findOneAndUpdate(query, updateData, { new: true });
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

export const approveDocument = async (id, userId, orgId, branchId) => {
  const now = new Date();
  const query = { _id: id };
  if (orgId) query.organization_id = orgId;
  if (branchId) query.branch_id = branchId;
  const doc = await Document.findOneAndUpdate(
    query,
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

export const publishDocument = async (id, userId, orgId, branchId) => {
  const now = new Date();
  const query = { _id: id };
  if (orgId) query.organization_id = orgId;
  if (branchId) query.branch_id = branchId;
  const doc = await Document.findOneAndUpdate(
    query,
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

export const rejectDocument = async (id, userId, remarks, orgId, branchId) => {
  const query = { _id: id };
  if (orgId) query.organization_id = orgId;
  if (branchId) query.branch_id = branchId;
  const doc = await Document.findOneAndUpdate(
    query,
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

export const deleteDocument = async (id, orgId, branchId) => {
  const query = { _id: id };
  if (orgId) query.organization_id = orgId;
  if (branchId) query.branch_id = branchId;
  const doc = await Document.findOne(query);
  if (!doc) throw new Error("Document not found");

  // Get all versions to delete their Cloudinary assets
  const versions = await DocumentVersion.find({ document_id: id }).lean();
  for (const ver of versions) {
    if (ver.cloudinary_public_id) {
      await deleteFromCloudinary(ver.cloudinary_public_id, ver.cloudinary_resource_type, {
        organizationId: doc.organization_id,
        branchId: doc.branch_id,
      }).catch((err) => {
        console.error(`Failed to delete Cloudinary asset ${ver.cloudinary_public_id}:`, err.message);
      });
    }
  }

  // Delete from DB: Document, Version, Chunk, RoleAccess, Verification, GraphNode, GraphRelationship, Topic
  const GraphNode = mongoose.models.GraphNode || null;
  const GraphRelationship = mongoose.models.GraphRelationship || mongoose.models.GraphEdge || null;
  const Topic = mongoose.models.Topic || null;

  await Promise.all([
    Document.findByIdAndDelete(id),
    DocumentVersion.deleteMany({ document_id: id }),
    DocumentChunk.deleteMany({ document_id: id }),
    DocumentRoleAccess.deleteMany({ document_id: id }),
    DocumentVerification.deleteMany({ document_id: id }),
    GraphNode ? GraphNode.deleteMany({ $or: [{ ref_id: id }, { "properties.document_id": id }] }).catch(() => null) : Promise.resolve(),
    GraphRelationship ? GraphRelationship.deleteMany({ $or: [{ source_document_id: id }, { target_document_id: id }, { chunk_id: id }] }).catch(() => null) : Promise.resolve(),
    Topic ? Topic.deleteMany({ document_id: id }).catch(() => null) : Promise.resolve(),
  ]);

  if (doc.organization_id) {
    await invalidateQuickActionCache(doc.organization_id);
    try {
      const { invalidateOrgResponseCache } = await import("../../services/promptCache.service.js");
      await invalidateOrgResponseCache(doc.organization_id);
    } catch {
      // cache clear best-effort
    }
  }

  return { message: "Document and all associated graph nodes, chunks, and caches deleted cleanly" };
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
