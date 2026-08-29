import mongoose, { Schema } from "mongoose";

const aiMessageSchema = new Schema(
  {
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: "AIConversation",
      required: true,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system", "tool"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sources: [
      {
        id: String,
        title: String,
        type: { type: String, default: "document" },
        chunk_id: String,
        document_id: String,
        relevance: Number,
        entities: [String],
      },
    ],
    tool_calls: [
      {
        action_id: String,
        tool: String,
        risk: String,
        status: String,
        result: Schema.Types.Mixed,
      },
    ],
    feedback: {
      type: String,
      enum: ["thumbs_up", "thumbs_down", null],
      default: null,
    },
    token_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

export default mongoose.models.AIMessage || mongoose.model("AIMessage", aiMessageSchema);
