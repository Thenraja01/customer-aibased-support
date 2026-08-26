import mongoose, { Schema } from "mongoose";

const aiConversationSchema = new Schema(
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
    title: {
      type: String,
      default: "New AI Workspace Conversation",
      trim: true,
    },
    mode: {
      type: String,
      enum: ["ask_ai", "knowledge", "tickets", "analytics", "documents"],
      default: "ask_ai",
    },
    model: {
      type: String,
      default: "ollama",
    },
    is_pinned: {
      type: Boolean,
      default: false,
    },
    is_archived: {
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

export default mongoose.models.AIConversation || mongoose.model("AIConversation", aiConversationSchema);
