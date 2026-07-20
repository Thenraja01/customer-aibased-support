import mongoose, { Schema } from "mongoose";

const apiUsageSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    status_code: { type: Number },
    response_time_ms: { type: Number },
    ip_address: { type: String },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

apiUsageSchema.index({ organization_id: 1, created_at: -1 });
apiUsageSchema.index({ user_id: 1, created_at: -1 });
apiUsageSchema.index({ created_at: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model("APIUsage", apiUsageSchema);
