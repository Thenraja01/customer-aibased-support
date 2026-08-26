import mongoose, { Schema } from "mongoose";

const aiActionSchema = new Schema(
  {
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: "AIConversation",
      required: true,
      index: true,
    },
    message_id: {
      type: Schema.Types.ObjectId,
      ref: "AIMessage",
      default: null,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    tool_name: {
      type: String,
      required: true,
    },
    arguments: {
      type: Schema.Types.Mixed,
      default: {},
    },
    risk_level: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING_CONFIRMATION", "CONFIRMED", "CANCELLED", "EXECUTED", "EXPIRED", "FAILED"],
      default: "PENDING_CONFIRMATION",
    },
    idempotency_key: {
      type: String,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
    },
    result: {
      type: Schema.Types.Mixed,
      default: null,
    },
    executed_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.models.AIAction || mongoose.model("AIAction", aiActionSchema);
