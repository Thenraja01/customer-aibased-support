import mongoose, { Schema } from "mongoose";

const userSessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refresh_token: { type: String, required: true },
    ip_address: { type: String },
    user_agent: { type: String },
    device_info: { type: String },
    expires_at: { type: Date },
    is_revoked: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

userSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("UserSession", userSessionSchema);
