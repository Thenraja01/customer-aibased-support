import mongoose, { Schema } from "mongoose";
import tenantPlugin from "../../../utils/tenant.plugin.js";

/**
 * Background job queue for async AI processing (document ingestion, embedding
 * generation, email sending, notification dispatch, knowledge sync, etc.).
 *
 * BackgroundJob
 * ─────────────
 * job_type     → the kind of work to do
 * status       → queued | processing | completed | failed | cancelled
 * payload      → arbitrary JSON data for the worker
 * result       → output / error details
 * retry_count  → how many times it has been retried
 * max_retries  → ceiling
 * started_at   → when processing began
 * finished_at  → when processing completed (success or failure)
 * created_by   → who enqueued the job
 */
const backgroundJobSchema = new mongoose.Schema(
  {
    job_type: {
      type: String,
      enum: [
        "document_ingest",
        "embedding_generate",
        "embedding_reindex",
        "email_send",
        "notification_send",
        "knowledge_sync",
        "knowledge_gap_resolution",
        "conversation_summarize",
        "ai_feedback_analysis",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed", "cancelled"],
      default: "queued",
      index: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    related_id: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    related_model: {
      type: String,
      maxlength: 50,
      default: null,
    },
    payload: { type: Schema.Types.Mixed, default: {} },
    result: { type: Schema.Types.Mixed, default: {} },
    error_message: { type: String, maxlength: 2000, default: null },
    retry_count: { type: Number, default: 0, min: 0 },
    max_retries: { type: Number, default: 3, min: 0 },
    priority: {
      type: Number,
      default: 0,
      index: true,
    },
    scheduled_at: { type: Date, default: Date.now, index: true },
    started_at: { type: Date, default: null },
    finished_at: { type: Date, default: null },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

backgroundJobSchema.plugin(tenantPlugin);

backgroundJobSchema.index({ status: 1, priority: -1, scheduled_at: 1 });
backgroundJobSchema.index({ job_type: 1, status: 1, organization_id: 1 });
backgroundJobSchema.index({ organization_id: 1, created_at: -1 });

export default mongoose.model("BackgroundJob", backgroundJobSchema);
