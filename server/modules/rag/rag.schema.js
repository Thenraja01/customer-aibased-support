import mongoose, { Schema } from "mongoose";

const ragQuerySchema = new mongoose.Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", index: true },
    organization_id: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    query: { type: String, required: true, maxlength: 2000 },
    query_embedding: { type: [Number], default: [] },
    result_count: { type: Number, default: 0 },
    source_documents: [{ type: Schema.Types.ObjectId, ref: "Document" }],
    response_time_ms: { type: Number, default: 0 },
    success: { type: Boolean, default: true },
    error_message: { type: String, maxlength: 500 },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

ragQuerySchema.index({ organization_id: 1, created_at: -1 });

export default mongoose.model("RagQuery", ragQuerySchema);
