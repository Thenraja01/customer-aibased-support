import mongoose, { Schema } from "mongoose";

const agentStepSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    tool: { type: String, default: null },
    args: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed", "cancelled"],
      default: "pending",
    },
    requiresConfirmation: { type: Boolean, default: false },
    result: { type: Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
    started_at: { type: Date, default: null },
    completed_at: { type: Date, default: null },
  },
  { _id: true }
);

const agentFlowSchema = new mongoose.Schema(
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
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
      index: true,
    },
    role: { type: String, default: "customer" },
    intent: {
      type: { type: String, default: "unknown" },
      tool: { type: String, default: null },
      confidence: { type: Number, default: 0 },
      params: { type: Schema.Types.Mixed, default: {} },
    },
    source_message: { type: String, default: "" },
    flow_key: { type: String, default: null, index: true },
    steps: { type: [agentStepSchema], default: [] },
    status: {
      type: String,
      enum: ["draft", "running", "completed", "failed", "cancelled"],
      default: "draft",
      index: true,
    },
    result: { type: Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
    started_at: { type: Date, default: null },
    completed_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

agentFlowSchema.index({ organization_id: 1, status: 1, created_at: -1 });
agentFlowSchema.index({ chat_id: 1, created_at: -1 });

export default mongoose.model("AgentFlow", agentFlowSchema);
