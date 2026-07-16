import mongoose, { Schema } from "mongoose";

const documentChunkSchema = new mongoose.Schema(
  {
    document_id: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    chunk_index: { type: Number, required: true },
    content: { type: String, required: true },
    content_hash: { type: String, index: true },
    embedding: { type: [Number], default: [] },
    keywords: { type: [String], default: [] },
    token_count: { type: Number, default: 0 },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

export default mongoose.model("DocumentChunk", documentChunkSchema);
