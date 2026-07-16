import mongoose, { Schema } from "mongoose";

const chatMemorySchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      index: true,
    },
    memory_type: {
      type: String,
      enum: ["fact", "preference", "summary", "pattern", "context"],
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    keywords: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    embedding: {
      type: [Number],
      default: [],
    },
    source_messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    confidence: {
      type: Number,
      default: 0.8,
      min: 0,
      max: 1,
    },
    access_count: {
      type: Number,
      default: 0,
    },
    last_accessed_at: {
      type: Date,
    },
    expires_at: {
      type: Date,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

chatMemorySchema.index({ user_id: 1, memory_type: 1 });
chatMemorySchema.index({ user_id: 1, is_active: 1 });
chatMemorySchema.index({ user_id: 1, chat_id: 1 });
chatMemorySchema.index({ keywords: 1 });
chatMemorySchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("ChatMemory", chatMemorySchema);
