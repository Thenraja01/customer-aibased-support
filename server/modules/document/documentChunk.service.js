import DocumentChunk from "./documentChunk.schema.js";
import { generateChunkHash } from "../../utils/hash.utils.js";

export const saveChunksWithDedup = async (chunks) => {
  const saved = [];
  for (const chunk of chunks) {
    const hash = generateChunkHash(chunk.content);
    const existing = await DocumentChunk.findOne({ content_hash: hash });
    if (!existing) {
      const doc = await DocumentChunk.create({ ...chunk, content_hash: hash });
      saved.push(doc);
    }
  }
  return saved;
};

export const getChunksByDocument = async (documentId) => {
  return await DocumentChunk.find({ document_id: documentId }).sort({
    chunk_index: 1,
  });
};

export const deleteChunksByDocument = async (documentId) => {
  await DocumentChunk.deleteMany({ document_id: documentId });
  return { message: "Chunks deleted" };
};

export const findByKeywords = async (keywords, documentId) => {
  const query = { keywords: { $in: keywords } };
  if (documentId) query.document_id = documentId;
  return await DocumentChunk.find(query);
};
