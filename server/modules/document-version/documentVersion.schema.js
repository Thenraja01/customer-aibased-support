import mongoose, { Schema } from "mongoose";

const documentVersionSchema = new mongoose.Schema(
  {
    document_id: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
      default: null,
      index: true,
    },
    version_number: {
      type: Number,
      required: true,
      min: 1,
    },
    file_id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    file_name: { type: String, required: true },
    file_mimetype: { type: String, required: true },
    file_size: { type: Number, default: 0 },

    // Cloudinary Metadata
    cloudinary_public_id: { type: String, default: null },
    cloudinary_resource_type: { type: String, default: null },
    cloudinary_version: { type: String, default: null },
    cloudinary_format: { type: String, default: null },

    // RBAC allowed roles
    allowed_roles: {
      type: [String],
      default: ["admin", "branch_admin", "support"],
    },
    storage_key: { type: String, default: null },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["uploaded", "processing", "ready_for_review", "pending_approval", "approved", "rejected", "published", "archived"],
      default: "uploaded",
    },
    changelog: { type: String, maxlength: 1000, default: "" },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

documentVersionSchema.index({ document_id: 1, version_number: 1 }, { unique: true });

export default mongoose.model("DocumentVersion", documentVersionSchema);
