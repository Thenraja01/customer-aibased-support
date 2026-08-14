import mongoose, { Schema } from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
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
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    tools: {
      type: [String],
      default: [], // e.g. ["get_refund", "check_refund_eligibility", "create_refund", "update_refund", "create_ticket"]
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Ensure topic name is unique per organization to avoid duplicates
topicSchema.index({ organization_id: 1, name: 1 }, { unique: true });

export default mongoose.model("Topic", topicSchema);
