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
      enum: ["active", "inactive", "blocked"],
      maxlength: 20,
      default: "active",
    },
    fcm_token: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export default mongoose.model("User", userSchema);
