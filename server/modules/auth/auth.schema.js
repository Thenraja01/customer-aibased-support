import mongoose, { Schema } from "mongoose";

const authTokenSchema = new mongoose.Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, index: true },
    type: { type: String, enum: ["refresh", "reset", "otp"], required: true },
    expires_at: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    is_revoked: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  }
);

export default mongoose.model("AuthToken", authTokenSchema);
