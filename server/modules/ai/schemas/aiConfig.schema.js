import mongoose, { Schema } from "mongoose";

const aiConfigSchema = new mongoose.Schema(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["ollama", "gemini", "groq", "google", "grok", "claude"],
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    display_name: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    default: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 1,
    },
    apiKey: {
      type: String,
      default: null,
    },
    configuration: {
      type: Schema.Types.Mixed,
      default: () => ({
        temperature: 0.7,
        max_tokens: 2048,
        system_prompt: "You are a helpful customer support assistant.",
        top_k: 40,
        similarity_threshold: 0.75,
        response_style: "balanced",
      }),
    },
    usage_limits: {
      monthly_request_limit: {
        type: Number,
        default: 1000,
      },
      monthly_token_limit: {
        type: Number,
        default: 1000000,
      },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Compound index for org-specific model lookups
aiConfigSchema.index({ organization_id: 1, provider: 1, model: 1 }, { unique: true });
aiConfigSchema.index({ organization_id: 1, default: 1 });
aiConfigSchema.index({ organization_id: 1, priority: 1 });

export default mongoose.model("AIConfig", aiConfigSchema);
