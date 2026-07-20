import mongoose, { Schema } from "mongoose";

const chatAnalyticsSchema = new mongoose.Schema(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      unique: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    total_messages: { type: Number, default: 0 },
    ai_messages: { type: Number, default: 0 },
    human_messages: { type: Number, default: 0 },
    avg_response_time_ms: { type: Number, default: 0 },
    user_satisfaction: {
      helpful: { type: Number, default: 0 },
      not_helpful: { type: Number, default: 0 },
    },
    first_response_time_ms: { type: Number },
    resolution_time_ms: { type: Number },
    escalation_count: { type: Number, default: 0 },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("ChatAnalytics", chatAnalyticsSchema);
