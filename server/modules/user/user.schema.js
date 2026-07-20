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
      enum: ["active", "inactive", "blocked", "pending"],
      maxlength: 20,
      default: "active",
    },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: Date, default: null },
    last_login: { type: Date },
    login_count: { type: Number, default: 0 },
    last_active_at: { type: Date },
    is_email_verified: { type: Boolean, default: false },
    email_verified_at: { type: Date },
    reset_password_token: { type: String },
    reset_password_expires: { type: Date },
    preferences: {
      theme: { type: String, enum: ["light", "dark"], default: "light" },
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
      chat_notifications: { type: Boolean, default: true },
      email_notifications: { type: Boolean, default: true },
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export default mongoose.model("User", userSchema);
