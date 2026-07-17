import mongoose, { Schema } from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    message_type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    file_url: { type: String },
    file_name: { type: String },
    is_ai: { type: Boolean, default: false, index: true },
    feedback: {
      type: String,
      enum: ["helpful", "not_helpful", null],
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

export default mongoose.model("Message", messageSchema);
