import mongoose, { Schema } from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assigned_to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    previously_assigned_to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reassignment_history: [
      {
        from_user: { type: Schema.Types.ObjectId, ref: "User" },
        to_user: { type: Schema.Types.ObjectId, ref: "User" },
        assigned_by: { type: Schema.Types.ObjectId, ref: "User" },
        assigned_at: { type: Date, default: Date.now },
        note: { type: String, maxlength: 1000 },
      },
    ],
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
      default: null,
      index: true,
    },
    // Human-readable per-tenant sequence number, e.g. "10025".
    ticket_number: {
      type: String,
      index: true,
    },
    subject: { type: String, required: true, maxlength: 255 },
    description: { type: String, required: true },
    category: {
      type: String,
      default: "other",
      index: true,
    },
    subcategory: { type: String, maxlength: 100, default: null },
    custom_fields: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: [
        "open",
        "assigned",
        "in_progress",
        "waiting_for_customer",
        "escalated",
        "resolved",
        "closed",
        "reopened",
        "cancelled",
      ],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    source: {
      type: String,
      default: "customer",
    },
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
      index: true,
    },
    team_id: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    incident_id: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
      default: null,
    },
    tags: [{ type: String, maxlength: 50 }],
    escalated_from_chat: {
      chat_id: { type: Schema.Types.ObjectId, ref: "Chat", default: null },
      confidence_score: { type: Number, min: 0, max: 1 },
      conversation_preview: { type: String, maxlength: 2000 },
    },
    escalation: {
      escalated_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
      escalated_at: { type: Date, default: null },
      reason: { type: String, maxlength: 2000, default: null },
      target: { type: String, maxlength: 50, default: null },
    },
    // SLA tracking (deadlines are set at creation / priority change).
    sla_due_at: { type: Date, default: null, index: true },
    first_response_due_at: { type: Date, default: null },
    first_response_at: { type: Date, default: null },
    sla_status: {
      type: String,
      enum: ["on_track", "warning", "breached"],
      default: "on_track",
      index: true,
    },
    sla_breached_at: { type: Date, default: null },
    // Chat context counters for real-time messaging.
    last_message_at: { type: Date, default: null },
    unread_customer_count: { type: Number, default: 0, min: 0 },
    unread_agent_count: { type: Number, default: 0, min: 0 },
    due_date: { type: Date },
    resolved_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolved_at: { type: Date },
    closed_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    closed_at: { type: Date },
    close_reason: { type: String, maxlength: 500, default: null },
    reopened_at: { type: Date, default: null },
    reopen_count: { type: Number, default: 0, min: 0 },
    // When a ticket is recreated after the reopen window, link back to the
    // previous closed ticket so history is preserved.
    linked_previous_ticket_id: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      default: null,
    },
    cancelled_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancelled_at: { type: Date, default: null },
    cancel_reason: { type: String, maxlength: 500, default: null },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Compound indexes for tenant + branch scoped queries
ticketSchema.index({ organization_id: 1, status: 1, created_at: -1 });
ticketSchema.index({ organization_id: 1, branch_id: 1, status: 1 });
ticketSchema.index({ organization_id: 1, branch_id: 1, assigned_to: 1, status: 1 });
ticketSchema.index({ organization_id: 1, user_id: 1, created_at: -1 });
ticketSchema.index({ organization_id: 1, ticket_number: 1 }, { unique: true });
ticketSchema.index({ incident_id: 1 });
ticketSchema.index({ organization_id: 1, created_at: -1 });
ticketSchema.index({ organization_id: 1, sla_status: 1, sla_due_at: 1 });

export default mongoose.model("Ticket", ticketSchema);