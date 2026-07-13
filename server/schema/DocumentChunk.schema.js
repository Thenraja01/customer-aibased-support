import mongoose, { Schema } from "mongoose";

const documentChunkSchema = new Schema(
  {
    document_id: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    chunk_index: {
      type: Number,
      required: true,
    },
    text_content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

documentChunkSchema.index({ document_id: 1, chunk_index: 1 }, { unique: true });

export default mongoose.model("DocumentChunk", documentChunkSchema);
