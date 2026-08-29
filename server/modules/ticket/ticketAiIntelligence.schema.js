import mongoose, { Schema } from "mongoose";

const ticketAiIntelligenceSchema = new mongoose.Schema(
  {
    ticket_id: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
      unique: true,
    },
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
    summary: { type: String, required: true },
    intent: { type: String, required: true },
    category: { type: String, default: "other" },
    subcategory: { type: String, default: null },
    product_service: { type: String, default: null },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    sentiment: {
      type: String,
      enum: ["frustrated", "neutral", "satisfied", "angry"],
      default: "neutral",
    },
    entities: [{ type: String }],
    business_impact: { type: String, default: "Low" },
    recommended_team: { type: String, default: "General Support" },
    recommended_agent_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    assignment_reason: { type: String, default: "Default assignment strategy" },
    policy_code: { type: String, default: "STD-01" },
    ai_confidence: { type: Number, min: 0, max: 100, default: 85 },
    sla_risk: {
      type: String,
      enum: ["low", "medium", "high", "at_risk", "breached"],
      default: "low",
    },
    remaining_sla_minutes: { type: Number, default: null },
    recommended_priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: null,
    },
    priority_reasons: [{ type: String }],
    knowledge_sources: [
      {
        title: String,
        score: Number,
        url: String,
        snippet: String,
      },
    ],
    knowledge_graph_path: [{ type: String }],
    suggested_response: { type: String, default: "" },
    escalation_recommended: { type: Boolean, default: false },
    escalation_reason: { type: String, default: null },
    structured_summary: {
      problem: String,
      actions_tried: String,
      current_status: String,
      important_evidence: String,
      knowledge_used: String,
      customer_sentiment: String,
      next_step: String,
      escalation_reason: String,
    },
    feedback: {
      status: {
        type: String,
        enum: ["pending", "accepted", "edited", "rejected"],
        default: "pending",
      },
      agent_edits: { type: String, default: null },
      rating: { type: Number, default: null },
      updated_at: { type: Date, default: null },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

ticketAiIntelligenceSchema.index({ organization_id: 1, created_at: -1 });

export default mongoose.model("TicketAiIntelligence", ticketAiIntelligenceSchema);
