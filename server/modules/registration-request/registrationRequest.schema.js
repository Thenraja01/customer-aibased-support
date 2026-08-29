import mongoose, { Schema } from "mongoose";

const registrationRequestSchema = new mongoose.Schema(
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
    requested_role_id: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    name: { type: String, required: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      maxlength: 100,
      lowercase: true,
      trim: true,
    },
    provider: { type: String, maxlength: 30, default: "local" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    rejection_reason: { type: String, maxlength: 500, default: null },
    approved_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approved_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

registrationRequestSchema.index({ organization_id: 1, status: 1 });
registrationRequestSchema.index({ user_id: 1, status: 1 });

export default mongoose.model("RegistrationRequest", registrationRequestSchema);