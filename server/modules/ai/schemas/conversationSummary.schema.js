import mongoose, { Schema } from "mongoose";
import tenantPlugin from "../../../utils/tenant.plugin.js";

/**
 * Auto-generated summary of a chat conversation.
 * Allows dashboards & AI to avoid re-reading hundreds of messages.
 *
 * ConversationSummary
 * ───────────────────
 * chat_id        → Chat._id
 * organization_id → tenant scoping
 * summary        → LLM-generated TL;DR
 * customer_sentiment → positive | neutral | negative | mixed
 * resolved       → whether the conversation reached resolution
 * message_count  → total messages summarized
 * key_topics     → extracted topics for search
 * generated_at   → when the summary was produced
 */
const conversationSummarySchema = new mongoose.Schema(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
      index: true,
    },
    summary: { type: String, required: true },
    customer_sentiment: {
      type: String,
      enum: ["positive", "neutral", "negative", "mixed"],
      default: "neutral",
      index: true,
    },
    resolved: { type: Boolean, default: false },
    resolution_note: { type: String, default: "" },
    message_count: { type: Number, default: 0 },
    key_topics: [{ type: String }],
    generated_by: {
      type: String,
      enum: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "claude-3", "custom", "other"],
      default: "custom",
    },
    generated_at: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

conversationSummarySchema.plugin(tenantPlugin);
conversationSummarySchema.index({ organization_id: 1, chat_id: 1 }, { unique: true });
conversationSummarySchema.index({ organization_id: 1, generated_at: -1 });
conversationSummarySchema.index({ organization_id: 1, resolved: 1 });

export default mongoose.model("ConversationSummary", conversationSummarySchema);
