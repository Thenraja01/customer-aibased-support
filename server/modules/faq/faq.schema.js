import mongoose, { Schema } from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    question: { type: String, required: true, maxlength: 500 },
    answer: { type: String, required: true },
    is_active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("Faq", faqSchema);
