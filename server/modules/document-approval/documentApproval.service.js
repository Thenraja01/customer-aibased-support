import DocumentApproval from "./documentApproval.schema.js";
import Document from "../document/document.schema.js";
import DocumentChunk from "../document/documentChunk.schema.js";
import DocumentVerification from "../document-verification/documentVerification.schema.js";
import { ingestDocument } from "../rag/rag.service.js";
import { extractTextFromBuffer } from "../../utils/extractText.utils.js";
import { downloadFromCloudinary } from "../../services/cloudinary.service.js";
import { invalidateQuickActionCache } from "../chat/quickAction.service.js";

/**
 * Submit a document for approval.
 * Transitions the document from ready_for_review → pending_approval
 * and creates an approval record.
 */
export const submitForApproval = async (documentId, userId, organizationId, branchId) => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error("Document not found");

  // Verify org/branch scope
  if (doc.organization_id.toString() !== organizationId.toString()) {
    throw new Error("Forbidden: Document belongs to another organization");
  }
  if (branchId && doc.branch_id.toString() !== branchId.toString()) {
    throw new Error("Forbidden: Document belongs to another branch");
  }

  // Only allow submission from certain statuses
  const allowed = ["uploaded", "ready_for_review", "needs_revision", "draft"];
  if (!allowed.includes(doc.status)) {
    throw new Error(`Cannot submit for approval from status: ${doc.status}`);
  }

  // Update document status
  doc.status = "pending_approval";
  await doc.save();

  // Create approval record
  const approval = await DocumentApproval.create({
    document_id: documentId,
    organization_id: organizationId,
    branch_id: doc.branch_id,
    requestedBy: userId,
    status: "pending",
    submittedAt: new Date(),
  });

  return { document: doc, approval };
};

/**
 * Approve a document.
 * Transitions document from pending_approval → approved.
 * Triggers RAG ingestion if text is available.
 */
export const approveDocument = async (documentId, reviewerId, organizationId, branchId, comment = "") => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error("Document not found");

  // Verify org/branch scope
  if (doc.organization_id.toString() !== organizationId.toString()) {
    throw new Error("Forbidden: Document belongs to another organization");
  }

  if (doc.status !== "pending_approval") {
    throw new Error(`Cannot approve document with status: ${doc.status}`);
  }

  // Update document
  doc.status = "approved";
  doc.approved_by = reviewerId;
  doc.approved_at = new Date();
  await doc.save();

  // Update approval record
  await DocumentApproval.findOneAndUpdate(
    { document_id: documentId, status: "pending" },
    {
      status: "approved",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      comment,
    },
    { sort: { created_at: -1 } }
  );

  // Update legacy verification
  await DocumentVerification.findOneAndUpdate(
    { document_id: documentId },
    { status: "approved", verified_by: reviewerId },
    { upsert: true, new: true }
  );

  // Update chunk statuses
  await DocumentChunk.updateMany(
    { document_id: documentId },
    {
      status: "approved",
      assigned_role: (doc.assigned_role || "all").toLowerCase(),
    }
  );

  // Trigger RAG ingestion in background
  triggerIngestion(doc).catch((err) =>
    console.error("[DocumentApproval] Ingestion failed:", err.message)
  );

  return doc;
};

/**
 * Reject a document.
 * Transitions document from pending_approval → rejected.
 */
export const rejectDocument = async (documentId, reviewerId, organizationId, branchId, comment = "") => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error("Document not found");

  if (doc.organization_id.toString() !== organizationId.toString()) {
    throw new Error("Forbidden: Document belongs to another organization");
  }

  if (doc.status !== "pending_approval") {
    throw new Error(`Cannot reject document with status: ${doc.status}`);
  }

  doc.status = "rejected";
  doc.rejection_reason = comment;
  await doc.save();

  await DocumentApproval.findOneAndUpdate(
    { document_id: documentId, status: "pending" },
    {
      status: "rejected",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      comment,
    },
    { sort: { created_at: -1 } }
  );

  await DocumentVerification.findOneAndUpdate(
    { document_id: documentId },
    { status: "rejected", verified_by: reviewerId, remarks: comment },
    { upsert: true, new: true }
  );

  await DocumentChunk.updateMany(
    { document_id: documentId },
    { status: "rejected" }
  );

  return doc;
};

/**
 * Request revision for a document.
 * Transitions from pending_approval → needs_revision.
 */
export const requestRevision = async (documentId, reviewerId, organizationId, comment = "") => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error("Document not found");

  if (doc.organization_id.toString() !== organizationId.toString()) {
    throw new Error("Forbidden: Document belongs to another organization");
  }

  doc.status = "needs_revision";
  await doc.save();

  await DocumentApproval.findOneAndUpdate(
    { document_id: documentId, status: "pending" },
    {
      status: "needs_revision",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      comment,
    },
    { sort: { created_at: -1 } }
  );

  return doc;
};

/**
 * Publish an approved document — makes it available via RAG.
 * Transitions from approved → published.
 */
export const publishDocument = async (documentId, userId, organizationId) => {
  const doc = await Document.findById(documentId);
  if (!doc) throw new Error("Document not found");

  if (doc.organization_id.toString() !== organizationId.toString()) {
    throw new Error("Forbidden: Document belongs to another organization");
  }

  if (doc.status !== "approved") {
    throw new Error(`Cannot publish document with status: ${doc.status}`);
  }

  doc.status = "published";
  await doc.save();

  await DocumentChunk.updateMany(
    { document_id: documentId },
    { status: "published" }
  );

  // Invalidate quick action cache since a new document is now published
  await invalidateQuickActionCache(doc.organization_id);

  return doc;
};

/**
 * Get pending approvals for an organization or branch.
 */
export const getPendingApprovals = async (organizationId, branchId = null, page = 1, limit = 20) => {
  const filter = {
    organization_id: organizationId,
    status: "pending",
  };
  if (branchId) filter.branch_id = branchId;

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    DocumentApproval.find(filter)
      .populate("document_id", "title file_name status visibility")
      .populate("requestedBy", "name email")
      .populate("branch_id", "name")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DocumentApproval.countDocuments(filter),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get approval history for a specific document.
 */
export const getDocumentApprovalHistory = async (documentId) => {
  return DocumentApproval.find({ document_id: documentId })
    .populate("requestedBy", "name email")
    .populate("reviewedBy", "name email")
    .sort({ created_at: -1 })
    .lean();
};

// ── Internal helper: trigger RAG ingestion for approved doc ──────────

const triggerIngestion = async (doc) => {
  if (!doc.cloudinary_public_id) return;

  const fileBuffer = await downloadFromCloudinary(doc.cloudinary_public_id, doc.cloudinary_resource_type);
  const text = await extractTextFromBuffer(fileBuffer, doc.file_mimetype);

  if (text.trim().length < 10) return;

  await DocumentChunk.deleteMany({ document_id: doc._id });
  await ingestDocument(
    doc._id,
    doc.organization_id,
    doc.branch_id,
    doc.assigned_role || "all",
    text,
    doc.status || "approved",
    doc.visibility || "branch",
    doc.accessPolicy?.customerVisible || false,
    doc.allowed_roles || ["admin", "branch_admin", "support"]
  );
};
