import mongoose, { Schema } from "mongoose";

const ticketTemplateSchema = new mongoose.Schema(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, maxlength: 100 },
    category: {
      type: String,
      required: true,
      maxlength: 100,
    },
    default_priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    default_subject: { type: String, required: true, maxlength: 255 },
    default_description: { type: String, required: true },
    is_active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("TicketTemplate", ticketTemplateSchema);
