import mongoose, { Schema } from "mongoose";
import tenantPlugin from "../../../utils/tenant.plugin.js";

/**
 * Aggregated AI usage analytics — tracks cost, latency, and token usage
 * per organization / user / model.
 *
 * AIUsage
 * ───────
 * organization_id → tenant
 * user_id         → who triggered the call
 * model           → e.g. "gpt-4-turbo"
 * input_tokens    → prompt tokens
 * output_tokens   → completion tokens
 * total_tokens    → input + output
 * cost_usd        → estimated cost in USD
 * latency_ms      → end-to-end inference time
 * endpoint        → e.g. "/chat/completions"
 * success         → whether the call succeeded
 */
const aiUsageSchema = new mongoose.Schema(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      index: true,
    },
    model: { type: String, maxlength: 100, index: true },
    provider: {
      type: String,
      maxlength: 50,
      default: "",
      index: true,
      enum: ["ollama", "gemini", "groq", "google", "grok", "claude", "fallback", ""],
    },
    feature: {
      type: String,
      maxlength: 60,
      default: "",
      index: true,
      enum: ["chat", "quick-action", "agent", "summarizer", "classifier", ""],
    },
    input_tokens: { type: Number, default: 0 },
    output_tokens: { type: Number, default: 0 },
    total_tokens: { type: Number, default: 0 },
    cost_usd: { type: Number, default: 0, min: 0 },
    latency_ms: { type: Number, default: 0, min: 0 },
    endpoint: { type: String, maxlength: 200, default: "" },
    success: { type: Boolean, default: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

aiUsageSchema.plugin(tenantPlugin);
aiUsageSchema.index({ organization_id: 1, created_at: -1 });
aiUsageSchema.index({ organization_id: 1, model: 1, created_at: -1 });
aiUsageSchema.index({ organization_id: 1, provider: 1, created_at: -1 });
aiUsageSchema.index({ organization_id: 1, feature: 1, created_at: -1 });
aiUsageSchema.index({ organization_id: 1, success: 1 });

// Virtual for convenience
aiUsageSchema.virtual("tokens").get(function () {
  return this.total_tokens || this.input_tokens + this.output_tokens;
});

export default mongoose.model("AIUsage", aiUsageSchema);
