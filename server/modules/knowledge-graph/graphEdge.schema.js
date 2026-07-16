import mongoose, { Schema } from "mongoose";

const graphEdgeSchema = new mongoose.Schema(
  {
    source_id: {
      type: Schema.Types.ObjectId,
      ref: "KnowledgeGraph",
      required: true,
      index: true,
    },
    target_id: {
      type: Schema.Types.ObjectId,
      ref: "KnowledgeGraph",
      required: true,
      index: true,
    },
    relationship: { type: String, maxlength: 100 },
    weight: { type: Number, default: 1 },
    document_id: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

export default mongoose.model("GraphEdge", graphEdgeSchema);
