import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema(
  {
    document_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    chunk_index: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    content_hash: {
      type: String,
      required: true,
      index: true,
    },
    token_count: {
      type: Number,
      default: 0,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    metadata: {
      page_number: Number,
      section: String,
      paragraph: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying
documentChunkSchema.index({ document_id: 1, chunk_index: 1 });
documentChunkSchema.index({ organization_id: 1, content_hash: 1 });

const DocumentChunk = mongoose.models.DocumentChunk || mongoose.model("DocumentChunk", documentChunkSchema);

export default DocumentChunk;
