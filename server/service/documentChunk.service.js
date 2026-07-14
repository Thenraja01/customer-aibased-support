import DocumentChunk from "../schema/DocumentChunk.schema.js";

// Save chunks after a document is split and embedded
export const saveChunks = async (documentId, chunks) => {
  // chunks: [{ chunk_index, text_content, embedding }]
  const docs = chunks.map((chunk) => ({
    document_id: documentId,
    chunk_index: chunk.chunk_index,
    text_content: chunk.text_content,
    embedding: chunk.embedding,
  }));
  return await DocumentChunk.insertMany(docs, { ordered: false });
};

// Get all chunks for a document (sorted by index)
export const getChunksByDocument = async (documentId) => {
  return await DocumentChunk.find({ document_id: documentId }).sort({
    chunk_index: 1,
  });
};

// Get a specific chunk by document and index
export const getChunkByIndex = async (documentId, chunkIndex) => {
  const chunk = await DocumentChunk.findOne({
    document_id: documentId,
    chunk_index: chunkIndex,
  });
  if (!chunk) throw new Error("Chunk not found");
  return chunk;
};

// Count chunks for a document
export const countChunks = async (documentId) => {
  return await DocumentChunk.countDocuments({ document_id: documentId });
};

// Delete all chunks for a document (used when re-indexing or deleting a doc)
export const deleteChunksByDocument = async (documentId) => {
  const result = await DocumentChunk.deleteMany({ document_id: documentId });
  return { deleted: result.deletedCount };
};

// Cosine similarity search (basic in-memory vector search)
// For production, use a vector DB (e.g., Pinecone, Qdrant, MongoDB Atlas Vector Search)
export const findSimilarChunks = async (documentId, queryEmbedding, topK = 5) => {
  const chunks = await DocumentChunk.find({ document_id: documentId });

  const cosineSimilarity = (a, b) => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return magA && magB ? dot / (magA * magB) : 0;
  };

  return chunks
    .map((chunk) => ({
      chunk_index: chunk.chunk_index,
      text_content: chunk.text_content,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
};