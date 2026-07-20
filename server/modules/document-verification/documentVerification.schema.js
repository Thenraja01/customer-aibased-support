import mongoose, { Schema } from "mongoose";

const documentVerificationSchema = new mongoose.Schema(
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
    verified_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verified_role: {
      type: String,
      maxlength: 50,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "changes_requested"],
      default: "pending",
      index: true,
    },
    remarks: { type: String, maxlength: 1000 },
    action_at: { type: Date, default: Date.now },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("DocumentVerification", documentVerificationSchema);
