import mongoose, { Schema } from "mongoose";

const approvalHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["pending_review", "approved", "rejected", "archived"],
      default: "pending_review",
    },
    decision_by: { type: Schema.Types.ObjectId, ref: "User" },
    decision_role: { type: String, maxlength: 50 },
    decision_at: { type: Date },
    decision_reason: { type: String, maxlength: 1000 },
  },
  { _id: false }
);

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
    document_type_id: {
      type: Schema.Types.ObjectId,
      ref: "DocumentType",
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "DocumentCategory",
      index: true,
    },
    title: { type: String, required: true, maxlength: 255 },
    description: { type: String, maxlength: 1000 },
    file_data: { type: Buffer },
    file_path: { type: String },
    file_key: { type: String },
    file_mimetype: { type: String, required: true },
    file_name: { type: String, required: true },
    file_size: { type: Number, default: 0 },
    is_knowledge_base: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["draft", "pending_review", "approved", "rejected", "archived"],
      default: "pending_review",
      index: true,
    },
    approval_history: [approvalHistorySchema],
    approval_meta: {
      decision: {
        type: String,
        enum: ["pending_review", "approved", "rejected", "archived"],
        default: "pending_review",
      },
      decision_by: { type: Schema.Types.ObjectId, ref: "User" },
      decision_role: { type: String, maxlength: 50 },
      decision_at: { type: Date },
      decision_reason: { type: String, maxlength: 1000 },
    },
    tags: [{ type: String, maxlength: 50 }],
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
    version: { type: Number, default: 1 },
    previous_version_id: { type: Schema.Types.ObjectId, ref: "Document" },
    version_notes: { type: String, maxlength: 500 },
    rag_status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    rag_error: { type: String, maxlength: 500 },
    rag_queued_at: { type: Date },
    processed_at: { type: Date },
    content_hash: { type: String, index: true },
    total_chunks: { type: Number, default: 0 },
    chunk_ids: [{ type: Schema.Types.ObjectId }],
    verified_by: { type: Schema.Types.ObjectId, ref: "User" },
    verified_at: { type: Date },
    access_count: { type: Number, default: 0 },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

documentSchema.index({ organization_id: 1, status: 1 });
documentSchema.index({ user_id: 1, status: 1 });
documentSchema.index({ document_type_id: 1, status: 1 });
documentSchema.index({ organization_id: 1, is_knowledge_base: 1 });
documentSchema.index({ content_hash: 1, organization_id: 1 });
documentSchema.index({ organization_id: 1, rag_status: 1 });

export default mongoose.model("Document", documentSchema);
