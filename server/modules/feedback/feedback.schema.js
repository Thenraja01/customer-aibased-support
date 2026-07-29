import mongoose, { Schema } from "mongoose";
import tenantPlugin from "../../utils/tenant.plugin.js";

const feedbackSchema = new mongoose.Schema(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    message_id: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true,
    },
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
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 1000,
    },
    was_helpful: {
      type: Boolean,
      required: true,
    },
    rag_score: {
      type: Number,
      min: 0,
      max: 1,
    },
    rag_fallback_used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

feedbackSchema.plugin(tenantPlugin);

export default mongoose.model("Feedback", feedbackSchema);