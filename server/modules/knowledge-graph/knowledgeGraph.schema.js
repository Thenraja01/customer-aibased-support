import mongoose, { Schema } from "mongoose";

const knowledgeGraphSchema = new mongoose.Schema(
  {
    document_id: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    entity_name: { type: String, required: true, maxlength: 255 },
    entity_type: { type: String, maxlength: 100 },
    content_hash: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

knowledgeGraphSchema.index({ document_id: 1, entity_name: 1 });

export default mongoose.model("KnowledgeGraph", knowledgeGraphSchema);
