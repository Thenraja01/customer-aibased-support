import mongoose, { Schema } from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
      default: null,
      index: true,
    },
    document_type_id: {
      type: Schema.Types.ObjectId,
      ref: "DocumentType",
    },
    title: { type: String, required: true, maxlength: 255 },
    description: { type: String, maxlength: 2000, default: "" },
    file_id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    file_name: { type: String, required: true },
    file_mimetype: { type: String, required: true },
    file_size: { type: Number, default: 0 },

    // Cloudinary Metadata
    cloudinary_public_id: { type: String, default: null },
    cloudinary_resource_type: { type: String, default: null },
    cloudinary_version: { type: String, default: null },
    cloudinary_format: { type: String, default: null },

    // RBAC allowed roles
    allowed_roles: {
      type: [String],
      default: ["admin", "branch_admin", "support"],
    },

    // ── Document lifecycle status ────────────────────────────
    // uploaded          → just uploaded, not yet processed
    // processing        → text extraction / chunking / embedding in progress
    // ready_for_review  → processing done, awaiting submitter to request approval
    // pending_approval  → submitted for approval, awaiting approver action
    // approved          → approved by authorized approver
    // rejected          → rejected by approver
    // needs_revision    → approver requested changes
    // published         → approved + made available to end users / RAG
    // archived          → removed from active use
    status: {
      type: String,
      enum: [
        "uploaded",
        "processing",
        "ready_for_review",
        "pending_approval",
        "approved",
        "rejected",
        "needs_revision",
        "published",
        "archived",
        // Legacy statuses (kept for backward compat during migration)
        "draft",
        "pending",
      ],
      default: "uploaded",
    },

    // ── Visibility / Access Policy ───────────────────────────
    // Controls who can see this document beyond the basic org+branch scope.
    visibility: {
      type: String,
      enum: [
        "branch",             // visible to all users in the branch
        "organization",       // visible to all users in the organization
        "private",            // visible only to uploader + admins
        "customer_visible",   // visible to customers (branch-scoped)
        "support_only",       // visible to support + admins only
      ],
      default: "branch",
    },

    // Granular access control
    accessPolicy: {
      // Which audience roles can access this document
      audience: {
        type: [String],
        default: ["branch_admin", "support"],
      },
      // Explicit customer visibility flag (used in RAG filtering)
      customerVisible: {
        type: Boolean,
        default: false,
      },
    },

    // Legacy role-based access (kept for backward compat)
    assigned_role: {
      type: String,
      default: "All",
    },

    // ── Approval tracking ────────────────────────────────────
    approved_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approved_at: { type: Date },
    published_at: { type: Date, default: null },
    rejection_reason: { type: String, maxlength: 1000 },

    // ── Verification tracking ────────────────────────────────
    verification_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    verified_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verified_at: { type: Date },

    // ── Knowledge pipeline state ─────────────────────────────
    // Mirrors the real processing stages so the UI can show real
    // progress instead of deriving it from the lifecycle `status`.
    //   ingestionStatus  : queued -> processing -> parsing -> chunking -> embedding -> completed / failed
    //   indexingStatus   : idle   -> indexing -> indexed / failed   (ChromaDB vectors)
    //   graphStatus      : idle   -> building -> built / failed     (MongoDB graph)
    //   topicStatus      : idle   -> detecting -> detected / failed
    knowledge_index_status: {
      type: String,
      enum: ["idle", "queued", "indexing", "indexed", "failed", "not_ingestible"],
      default: "idle",
    },
    ingestionStatus: {
      type: String,
      enum: ["idle", "queued", "processing", "parsing", "chunking", "embedding", "completed", "failed"],
      default: "idle",
    },
    indexingStatus: {
      type: String,
      enum: ["idle", "indexing", "indexed", "failed"],
      default: "idle",
    },
    graphStatus: {
      type: String,
      enum: ["idle", "building", "built", "failed"],
      default: "idle",
    },
    topicStatus: {
      type: String,
      enum: ["idle", "detecting", "detected", "failed"],
      default: "idle",
    },
    chunk_count: { type: Number, default: 0 },
    embedded_chunk_count: { type: Number, default: 0 },
    indexed_chunk_count: { type: Number, default: 0 },
    ingestion_error: { type: String, maxlength: 2000, default: null },
    failed_stage: { type: String, default: null },
    retry_count: { type: Number, default: 0 },
    last_indexed_at: { type: Date, default: null },

    // ── Versioning ───────────────────────────────────────────
    currentVersionId: {
      type: Schema.Types.ObjectId,
      ref: "DocumentVersion",
      default: null,
    },
    version_number: { type: Number, default: 1 },

    // ── Storage key for MinIO (future) ───────────────────────
    storage_key: { type: String, default: null },

    // ── Associated Topics & AI Summaries ────────────────────
    topics: {
      type: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
      default: [],
      index: true,
    },
    summary: { type: String, default: "" },
    context_summary: { type: String, default: "" },
    key_topics: { type: [String], default: [] },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Compound indexes for tenant + branch scoped queries
documentSchema.index({ organization_id: 1, branch_id: 1, status: 1 });
documentSchema.index({ organization_id: 1, branch_id: 1, visibility: 1 });
documentSchema.index({ organization_id: 1, status: 1 });

export default mongoose.model("Document", documentSchema);
