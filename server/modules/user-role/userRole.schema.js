import mongoose, { Schema } from "mongoose";

const userRoleSchema = new mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role_id: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    assigned_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Compound indexes for efficient queries
userRoleSchema.index({ user_id: 1, organization_id: 1 });
userRoleSchema.index({ role_id: 1, organization_id: 1 });
userRoleSchema.index({ user_id: 1, role_id: 1, organization_id: 1 }, { unique: true });

export default mongoose.model("UserRole", userRoleSchema);