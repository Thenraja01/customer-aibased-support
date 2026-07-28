import mongoose from "mongoose";

const knowledgeGapSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  chat_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    default: null,
  },
  query: {
    type: String,
    required: true,
  },
  best_score: {
    type: Number,
    default: 0,
  },
  avg_score: {
    type: Number,
    default: 0,
  },
  matched_chunks: {
    type: Number,
    default: 0,
  },
  keywords: [{
    type: String,
  }],
  topic: {
    type: String,
    default: "uncategorized",
    index: true,
  },
  status: {
    type: String,
    enum: ["unresolved", "reviewed", "resolved", "dismissed"],
    default: "unresolved",
    index: true,
  },
  resolution_note: {
    type: String,
    default: "",
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  resolved_at: {
    type: Date,
    default: null,
  },
  frequency: {
    type: Number,
    default: 1,
  },
  last_seen_at: {
    type: Date,
    default: Date.now,
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

knowledgeGapSchema.index({ organization_id: 1, status: 1 });
knowledgeGapSchema.index({ organization_id: 1, topic: 1 });
knowledgeGapSchema.index({ organization_id: 1, best_score: 1 });
knowledgeGapSchema.index({ query: "text" });

const KnowledgeGap = mongoose.model("KnowledgeGap", knowledgeGapSchema);
export default KnowledgeGap;