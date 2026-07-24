import mongoose, { Schema } from "mongoose";

const documentRoleAccessSchema = new mongoose.Schema(
  {
    document_id: {
      type: Schema.Types.ObjectId,
      ref: "Document",
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
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

documentRoleAccessSchema.index({ document_id: 1, role_id: 1 }, { unique: true });

export default mongoose.model("DocumentRoleAccess", documentRoleAccessSchema);
