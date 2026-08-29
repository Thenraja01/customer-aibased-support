import mongoose, { Schema } from "mongoose";

const chatQuickActionSchema = new mongoose.Schema(
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
    label: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    query: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "help-circle",
    },
    rank: {
      type: Number,
      default: 0,
    },
    usage_count: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      enum: ["document", "document_type", "faq", "graph", "llm", "manual"],
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Optimize query patterns for organization-specific and branch-specific searches
chatQuickActionSchema.index({ organization_id: 1, branch_id: 1, is_active: 1 });

export default mongoose.model("ChatQuickAction", chatQuickActionSchema);
