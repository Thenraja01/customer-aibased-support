import mongoose, { Schema } from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assigned_to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    subject: { type: String, required: true, maxlength: 255 },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    tags: [{ type: String, maxlength: 50 }],
    due_date: { type: Date },
    sla_breached: { type: Boolean, default: false },
    sla_breached_at: { type: Date },
    ai_classification: { type: String },
    ai_suggested_reply: { type: String },
    escalation_count: { type: Number, default: 0 },
    resolved_at: { type: Date },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

ticketSchema.index({ organization_id: 1, assigned_to: 1, status: 1 });
ticketSchema.index({ user_id: 1, status: 1 });

export default mongoose.model("Ticket", ticketSchema);
