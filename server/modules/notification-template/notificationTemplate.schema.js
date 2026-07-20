import mongoose, { Schema } from "mongoose";

const notificationTemplateSchema = new mongoose.Schema({
  organization_id: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  name: { type: String, required: true, maxlength: 100 },
  title: { type: String, required: true, maxlength: 255 },
  message: { type: String, required: true },
  type: { type: String, enum: ["info", "warning", "success", "error"], default: "info" },
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

notificationTemplateSchema.index({ organization_id: 1, is_active: 1 });

export default mongoose.model("NotificationTemplate", notificationTemplateSchema);
