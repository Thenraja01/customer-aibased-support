import mongoose, { Schema } from "mongoose";

const aiSessionSchema = new mongoose.Schema(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    model: { type: String, maxlength: 100 },
    tokens_used: { type: Number, default: 0 },
    messages_count: { type: Number, default: 0 },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

export default mongoose.model("AISession", aiSessionSchema);
