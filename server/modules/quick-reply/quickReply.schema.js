import mongoose, { Schema } from "mongoose";

const quickReplySchema = new mongoose.Schema({
  organization_id: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  title: { type: String, required: true, maxlength: 100 },
  content: { type: String, required: true, maxlength: 1000 },
  category: { type: String, maxlength: 50, default: "general" },
  tags: [{ type: String, maxlength: 50 }],
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

quickReplySchema.index({ organization_id: 1, category: 1 });
quickReplySchema.index({ organization_id: 1, is_active: 1 });

export default mongoose.model("QuickReply", quickReplySchema);
