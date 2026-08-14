import mongoose, { Schema } from "mongoose";

const documentChunkSchema = new mongoose.Schema(
  {
    document_id: {
      type: Schema.Types.ObjectId,
      ref: "Document",
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

    // ── Security metadata (stored with every chunk for pre-retrieval filtering) ──
    assigned_role: {
      type: String,
      default: "All",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "draft", "pending", "approved", "rejected",
        "uploaded", "processing", "ready_for_review",
        "pending_approval", "needs_revision", "published", "archived",
      ],
      default: "draft",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["branch", "organization", "private", "customer_visible", "support_only"],
      default: "branch",
      index: true,
    },
    // Explicit flag for customer RAG filtering
    customerVisible: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Which roles can retrieve this chunk via RAG
    allowedRoles: {
      type: [String],
      default: ["branch_admin", "support"],
      index: true,
    },

    // ── Versioning ──
    documentVersionId: {
      type: Schema.Types.ObjectId,
      ref: "DocumentVersion",
      default: null,
    },

    // ── Content ──
    chunk_index: { type: Number, required: true },
    content: { type: String, required: true },
    content_hash: { type: String, index: true },
    embedding: { type: [Number], default: [] },
    keywords: { type: [String], default: [] },
    token_count: { type: Number, default: 0 },
    topics: {
      type: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
      default: [],
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

// Compound indexes for pre-retrieval security filtering
documentChunkSchema.index({ organization_id: 1, branch_id: 1, status: 1 });
documentChunkSchema.index({ organization_id: 1, branch_id: 1, status: 1, customerVisible: 1 });
documentChunkSchema.index({ organization_id: 1, branch_id: 1, visibility: 1, status: 1 });

export default mongoose.model("DocumentChunk", documentChunkSchema);
