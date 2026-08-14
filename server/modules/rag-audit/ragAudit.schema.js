import mongoose, { Schema } from "mongoose";

const ragAuditSchema = new mongoose.Schema(
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
      default: null,
      index: true,
    },
    question: {
      type: String,
      required: true,
    },
    retrievedDocumentIds: [{
      type: Schema.Types.ObjectId,
      ref: "Document",
    }],
    retrievedChunkIds: [{
      type: Schema.Types.ObjectId,
      ref: "DocumentChunk",
    }],
    answer: {
      type: String,
      default: "",
    },
    model: {
      type: String,
      maxlength: 100,
      default: "",
    },
    latency_ms: {
      type: Number,
      default: 0,
    },
    // Security context used for retrieval
    securityContext: {
      role: { type: String },
      statusFilter: { type: String },
      branchFiltered: { type: Boolean, default: false },
      customerVisible: { type: Boolean, default: false },
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

ragAuditSchema.index({ organization_id: 1, created_at: -1 });
ragAuditSchema.index({ user_id: 1, created_at: -1 });

export default mongoose.model("RagAudit", ragAuditSchema);
