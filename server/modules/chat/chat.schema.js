import mongoose, { Schema } from "mongoose";

const chatSchema = new mongoose.Schema(
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
      default: null,
      index: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    assigned_to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    topic: { type: String, maxlength: 255, default: "General" },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: [
        "AI_ACTIVE",
        "AI_RESOLVED",
        "HUMAN_REQUESTED",
        "HUMAN_QUEUED",
        "HUMAN_ACTIVE",
        "HUMAN_RESOLVED",
        "CONVERTED_TO_TICKET",
        "CLOSED",
        "open",
        "closed",
        "escalated",
        "in_progress",
        "waiting_for_agent",
      ],
      default: "AI_ACTIVE",
      index: true,
    },
    is_escalated: {
      type: Boolean,
      default: false,
      index: true,
    },
    escalated_at: {
      type: Date,
      default: null,
    },
    ticket_id: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      default: null,
    },
    escalation_reason: {
      type: String,
      default: null,
    },
    low_confidence: {
      type: Boolean,
      default: false,
    },
    last_message_at: {
      type: Date,
      default: Date.now,
    },
    is_copilot: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("Chat", chatSchema);
