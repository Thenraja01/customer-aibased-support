import mongoose, { Schema } from "mongoose";

const searchLogSchema = new mongoose.Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", index: true },
    organization_id: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    query: { type: String, required: true, maxlength: 500 },
    type: { type: String, enum: ["all", "documents", "tickets", "chats", "messages", "users"], default: "all" },
    result_count: { type: Number, default: 0 },
    response_time_ms: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

searchLogSchema.index({ organization_id: 1, created_at: -1 });

export default mongoose.model("SearchLog", searchLogSchema);
