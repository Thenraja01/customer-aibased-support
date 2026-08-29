import mongoose, { Schema } from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    question: { type: String, required: true, maxlength: 500 },
    answer: { type: String, required: true },
    category: { type: String, maxlength: 100, default: "general" },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
      index: true,
    },
    is_active: { type: Boolean, default: true, index: true },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approved_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approved_at: { type: Date },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("Faq", faqSchema);
