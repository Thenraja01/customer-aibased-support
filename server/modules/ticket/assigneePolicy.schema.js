import mongoose, { Schema } from "mongoose";

const assigneePolicySchema = new mongoose.Schema(
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
    },
    name: { type: String, required: true },
    code: { type: String, required: true },
    priority_order: { type: Number, default: 100 },
    enabled: { type: Boolean, default: true },
    conditions: {
      category: { type: String, default: null },
      subcategory: { type: String, default: null },
      priority: { type: String, default: null },
      severity: { type: String, default: null },
      product: { type: String, default: null },
    },
    actions: {
      assign_team: { type: String, default: null },
      assign_agent_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
      assignment_strategy: {
        type: String,
        enum: ["least_loaded", "weighted", "hybrid", "specific_agent"],
        default: "hybrid",
      },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

assigneePolicySchema.index({ organization_id: 1, enabled: 1, priority_order: 1 });

export default mongoose.model("AssigneePolicy", assigneePolicySchema);
