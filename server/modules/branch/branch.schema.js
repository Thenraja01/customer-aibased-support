import mongoose, { Schema } from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, maxlength: 100, trim: true },
    code: { type: String, maxlength: 50, trim: true, uppercase: true },
    address: { type: String, maxlength: 255 },
    phone: { type: String, maxlength: 20 },
    email: { type: String, maxlength: 255, lowercase: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    description: { type: String, maxlength: 500 },

    // Branch-Level Configurations (Overrides Organization Configs)
    smtp_config: {
      host: { type: String, default: "" },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      user: { type: String, default: "" },
      pass: { type: String, default: "" },
      from: { type: String, default: "" },
      enabled: { type: Boolean, default: false },
    },
    llm_config: {
      provider: { type: String, default: "" },
      api_key: { type: String, default: "" },
      model: { type: String, default: "" },
      model_name: { type: String, default: "" },
      base_url: { type: String, default: "" },
      groq_api_key: { type: String, default: "" },
      gemini_api_key: { type: String, default: "" },
      openai_api_key: { type: String, default: "" },
      grok_api_key: { type: String, default: "" },
      claude_api_key: { type: String, default: "" },
      timeout_ms: { type: Number, default: 5000 },
      max_retries: { type: Number, default: 2 },
      temperature: { type: Number, default: 0.7 },
      max_tokens: { type: Number, default: 2048 },
    },
    cloudinary_config: {
      cloud_name: { type: String, default: "" },
      api_key: { type: String, default: "" },
      api_secret: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    rag_config: {
      chunk_size: { type: Number, default: 0 },
      chunk_overlap: { type: Number, default: 0 },
      top_k: { type: Number, default: 0 },
      min_score: { type: Number, default: 0 },
      bfs_max_depth: { type: Number, default: 0 },
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

branchSchema.index({ organization_id: 1, name: 1 }, { unique: true });

export default mongoose.model("Branch", branchSchema);
