import mongoose, { Schema } from "mongoose";
import tenantPlugin from "../../../utils/tenant.plugin.js";

/**
 * Feedback on an AI-generated response.
 *
 * AIFeedback
 * ──────────
 * response_id  → AISession._id (or Message._id for the AI message)
 * chat_id      → Chat._id
 * user_id      → who gave the feedback
 * rating       → 1–5 stars (0 = not provided)
 * helpful      → boolean thumb-up/down
 * feedback     → free-text elaboration
 * category     → what kind of problem (if any)
 */
const aiFeedbackSchema = new mongoose.Schema(
  {
    response_id: {
      type: Schema.Types.ObjectId,
      ref: "AISession",
      index: true,
    },
    message_id: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      index: true,
    },
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    helpful: {
      type: Boolean,
      default: null,
    },
    feedback: { type: String, maxlength: 2000, default: "" },
    category: {
      type: String,
      enum: [
        "accurate",
        "inaccurate",
        "too_vague",
        "too_long",
        "too_short",
        "irrelevant",
        "other",
      ],
      default: "other",
      index: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

aiFeedbackSchema.plugin(tenantPlugin);
aiFeedbackSchema.index({ organization_id: 1, chat_id: 1, created_at: -1 });
aiFeedbackSchema.index({ organization_id: 1, helpful: 1 });
aiFeedbackSchema.index({ organization_id: 1, rating: 1 });

export default mongoose.model("AIFeedback", aiFeedbackSchema);
