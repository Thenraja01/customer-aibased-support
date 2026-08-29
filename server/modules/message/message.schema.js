import mongoose, { Schema } from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    content: { type: String, required: true },
    message_type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    is_ai: { type: Boolean, default: false, index: true },
    confidence: { type: Number, default: null },
    citations: { type: Array, default: [] },
    escalation: {
      available: { type: Boolean, default: false },
      reason: { type: String, default: "" },
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("Message", messageSchema);
