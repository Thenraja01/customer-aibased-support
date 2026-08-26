import mongoose, { Schema } from "mongoose";

const incidentSchema = new mongoose.Schema(
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
    title: { type: String, required: true, maxlength: 255 },
    description: { type: String, required: true, maxlength: 5000 },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["detected", "investigating", "identified", "mitigating", "resolved", "closed"],
      default: "detected",
      index: true,
    },
    affected_service: { type: String, maxlength: 255, default: null },
    affected_ticket_count: { type: Number, default: 0, min: 0 },
    started_at: { type: Date, default: Date.now },
    resolved_at: { type: Date, default: null },
    resolved_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    closed_at: { type: Date, default: null },
    owner: { type: Schema.Types.ObjectId, ref: "User", default: null },
    created_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    timeline: [
      {
        status: { type: String },
        note: { type: String, maxlength: 2000 },
        changed_by: { type: Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

incidentSchema.index({ organization_id: 1, status: 1, created_at: -1 });
incidentSchema.index({ organization_id: 1, branch_id: 1, status: 1 });
incidentSchema.index({ organization_id: 1, severity: 1, status: 1 });

export default mongoose.model("Incident", incidentSchema);