import mongoose, { Schema } from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    role_name: {
      type: String,
      required: true,
      unique: true,
      maxlength: 100,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
      default: null,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Compound indexes for efficient queries
roleSchema.index({ organization_id: 1, status: 1 });
roleSchema.index({ role_name: 1, organization_id: 1 }, { unique: true, sparse: true });

export default mongoose.model("Role", roleSchema);