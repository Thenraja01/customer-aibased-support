import DocumentChunk from "../schema/DocumentChunk.schema.js";

export const createChunk = async (chunkData) => {
  return await DocumentChunk.create(chunkData);
};
export const createChunks = async (chunks) => {
  return await DocumentChunk.insertMany(chunks);
};
export const getAllChunks = async () => {
  return await DocumentChunk.find()
    .populate("document_id")
    .sort({ document_id: 1, chunk_index: 1 });
};

/**
 * Get chunk by ID
 */
export const getChunkById = async (chunkId) => {
  return await DocumentChunk.findById(chunkId)
    .populate("document_id");
};

/**
 * Get all chunks of a document
 */
export const getChunksByDocument = async (documentId) => {
  return await DocumentChunk.find({
    document_id: documentId,
  }).sort({ chunk_index: 1 });
};

/**
 * Get a specific chunk using its index
 */
export const getChunkByIndex = async (documentId, chunkIndex) => {
  return await DocumentChunk.findOne({
    document_id: documentId,
    chunk_index: chunkIndex,
  });
};

/**
 * Get first chunk
 */
export const getFirstChunk = async (documentId) => {
  return await DocumentChunk.findOne({
    document_id: documentId,
  }).sort({ chunk_index: 1 });
};

export const getLastChunk = async (documentId) => {
  return await DocumentChunk.findOne({
    document_id: documentId,
  }).sort({ chunk_index: -1 });
};

export const countChunks = async (documentId) => {
  return await DocumentChunk.countDocuments({
    document_id: documentId,
  });
};
export const updateChunkText = async (chunkId, textContent) => {
  return await DocumentChunk.findByIdAndUpdate(
    chunkId,
    {
      text_content: textContent,
    },
    {
      new: true,
      runValidators: true,
    }
  );
};

export const updateChunkEmbedding = async (chunkId, embedding) => {
  return await DocumentChunk.findByIdAndUpdate(
    chunkId,
    {
      embedding,
    },
    {
      new: true,
    }
  );
};

export const updateChunk = async (chunkId, updateData) => {
  return await DocumentChunk.findByIdAndUpdate(
    chunkId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );
};

export const searchChunks = async (keyword) => {
  return await DocumentChunk.find({
    text_content: {
      $regex: keyword,
      $options: "i",
    },
  }).populate("document_id");
};

export const deleteChunk = async (chunkId) => {
  return await DocumentChunk.findByIdAndDelete(chunkId);
};

export const deleteChunksByDocument = async (documentId) => {
  return await DocumentChunk.deleteMany({
    document_id: documentId,
  });
};

/**
 * Delete all chunks
 */
export const deleteAllChunks = async () => {
  return await DocumentChunk.deleteMany({});
};

/**
 * Check whether a document has chunks
 */
export const hasChunks = async (documentId) => {
  const count = await DocumentChunk.countDocuments({
    document_id: documentId,
  });

  return count > 0;
};

/**
 * Get chunk statistics
 */
export const getChunkStatistics = async (documentId) => {
  const totalChunks = await DocumentChunk.countDocuments({
    document_id: documentId,
  });

  const firstChunk = await DocumentChunk.findOne({
    document_id: documentId,
  }).sort({ chunk_index: 1 });

  const lastChunk = await DocumentChunk.findOne({
    document_id: documentId,
  }).sort({ chunk_index: -1 });

  return {
    totalChunks,
    firstChunk,
    lastChunk,
  };
};