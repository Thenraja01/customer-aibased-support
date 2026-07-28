import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    role_id: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    name: { type: String, required: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      maxlength: 100,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
    },
    phone: { type: String, maxlength: 20 },
    password: { type: String, required: true, maxlength: 255 },
    dob: { type: Date },
    auth_type: {
      type: String,
      enum: ["local", "google", "github"],
      maxlength: 30,
      default: "local",
    },
    status: {
      type: String,
      // pending   = awaiting admin review
      // approved  = admin approved, OTP not yet verified
      // active    = fully verified, can login
      // inactive  = disabled by admin
      // blocked   = rejected / blocked
      enum: ["pending", "approved", "active", "inactive", "blocked"],
      maxlength: 20,
      default: "active",
    },
    // Admin approval tracking
    approved_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approved_at: { type: Date, default: null },
    rejection_reason: { type: String, maxlength: 500, default: null },

    fcm_token: { type: String, default: null },
    otp: { type: String, default: null },
    otp_expiry: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export default mongoose.model("User", userSchema);
