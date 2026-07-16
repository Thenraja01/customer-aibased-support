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
    is_ai: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("Message", messageSchema);
