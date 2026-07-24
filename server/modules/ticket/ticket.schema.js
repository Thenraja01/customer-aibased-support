import mongoose, { Schema } from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
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
    category: {
      type: String,
      enum: ["bug", "feature_request", "question", "billing", "account", "other"],
      default: "other",
    },
    status: {
      type: String,
      enum: ["open", "assigned", "in_progress", "waiting_for_customer", "resolved", "closed"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    tags: [{ type: String, maxlength: 50 }],
    escalated_from_chat: {
      chat_id: { type: Schema.Types.ObjectId, ref: "Chat", default: null },
      confidence_score: { type: Number, min: 0, max: 1 },
      conversation_preview: { type: String, maxlength: 2000 },
    },
    due_date: { type: Date },
    resolved_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolved_at: { type: Date },
    closed_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    closed_at: { type: Date },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("Ticket", ticketSchema);
