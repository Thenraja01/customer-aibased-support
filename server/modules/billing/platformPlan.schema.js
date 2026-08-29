import mongoose from "mongoose";

const platformPlanSchema = new mongoose.Schema(
  {
    plan_key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price_usd: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    storage_limit_bytes: {
      type: Number,
      required: true,
      default: 524288000, // 500 MB
    },
    ai_requests_limit: {
      type: Number,
      required: true,
      default: 1000,
    },
    blurb: {
      type: String,
      default: "",
    },
    features: {
      type: [String],
      default: [],
    },
    badge: {
      type: String,
      default: "",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    sort_order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.model("PlatformPlan", platformPlanSchema);
