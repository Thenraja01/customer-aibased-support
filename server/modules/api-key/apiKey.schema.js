import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key_hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    key_prefix: {
      type: String,
      required: true,
    },
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scopes: {
      type: [String],
      default: ["*"],
    },
    type: {
      type: String,
      enum: ["public", "secret"],
      default: "secret",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
      index: true,
    },
    expires_at: {
      type: Date,
      default: null,
    },
    last_used_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

apiKeySchema.index({ organization_id: 1, status: 1 });

const ApiKey = mongoose.models.ApiKey || mongoose.model("ApiKey", apiKeySchema);
export default ApiKey;
