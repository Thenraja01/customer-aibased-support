import mongoose, { Schema } from "mongoose";

const refreshSessionSchema = new mongoose.Schema(
  {
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
      index: true,
    },
    token_hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user_agent: { type: String, default: "" },
    ip: { type: String, default: "" },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
    revoked_at: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

refreshSessionSchema.index({ user_id: 1, revoked_at: 1 });
refreshSessionSchema.index({ organization_id: 1, revoked_at: 1 });

export default mongoose.model("RefreshSession", refreshSessionSchema);