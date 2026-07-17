import mongoose, { Schema } from "mongoose";

const interactionSchema = new Schema(
  {
    query: { type: String },
    response: { type: String },
    intent: { type: String },
    rag_chunks_used: { type: Number, default: 0 },
    kg_nodes_used: { type: Number, default: 0 },
    response_time_ms: { type: Number, default: 0 },
    tokens_used: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const aiSessionSchema = new mongoose.Schema(
  {
    chat_id: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    model: { type: String, maxlength: 100 },
    tokens_used: { type: Number, default: 0 },
    messages_count: { type: Number, default: 0 },
    interactions: {
      type: [interactionSchema],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

aiSessionSchema.index({ organization_id: 1, created_at: -1 });
aiSessionSchema.index({ model: 1 });

export default mongoose.model("AISession", aiSessionSchema);
