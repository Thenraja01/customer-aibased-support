import mongoose, { Schema } from "mongoose";

const ticketTemplateSchema = new mongoose.Schema({
  organization_id: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  name: { type: String, required: true, maxlength: 100 },
  subject: { type: String, required: true, maxlength: 255 },
  description: { type: String, required: true },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  tags: [{ type: String, maxlength: 50 }],
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

ticketTemplateSchema.index({ organization_id: 1, is_active: 1 });

export default mongoose.model("TicketTemplate", ticketTemplateSchema);
