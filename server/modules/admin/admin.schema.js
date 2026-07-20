import mongoose, { Schema } from "mongoose";

const adminDashboardSchema = new mongoose.Schema(
  {
    organization_id: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    type: { type: String, enum: ["daily", "weekly", "monthly"], default: "daily" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    period_start: { type: Date, required: true },
    period_end: { type: Date, required: true },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

adminDashboardSchema.index({ organization_id: 1, type: 1, period_start: -1 });

export default mongoose.model("AdminDashboard", adminDashboardSchema);
