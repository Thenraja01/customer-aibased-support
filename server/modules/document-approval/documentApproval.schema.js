import mongoose, { Schema } from "mongoose";

const documentApprovalSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    // User who submitted the document for approval
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // User who approved or rejected
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "needs_revision"],
      default: "pending",
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    comment: {
      type: String,
      maxlength: 2000,
      default: "",
    },
    // Optional: approval level for multi-step approval workflows
    approvalLevel: {
      type: Number,
      default: 1,
      min: 1,
    },
    approverRole: {
      type: String,
      maxlength: 50,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Compound indexes
documentApprovalSchema.index({ organization_id: 1, branch_id: 1, status: 1 });
documentApprovalSchema.index({ document_id: 1, status: 1 });

export default mongoose.model("DocumentApproval", documentApprovalSchema);
