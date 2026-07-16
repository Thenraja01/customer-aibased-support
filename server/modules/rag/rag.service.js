import DocumentChunk from "../document/documentChunk.schema.js";
import Document from "../document/document.schema.js";
import {
  deleteNodesByDocument,
  deleteEdgesByDocument,
  getGraphStats,
} from "../knowledge-graph/knowledgeGraph.service.js";
import {
  chunkHashMap,
  keywordIndexMap,
} from "./hashmap.service.js";
import {
  buildFullContext,
  appendToShortTerm,
  getRelevantMemories,
} from "../memory/memory.service.js";

export const extractKeywords = (text) => {
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for", "of", "and", "or", "but"]);
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
};

export const chunkText = (text, chunkSize = 500, overlap = 50) => {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start + overlap >= text.length) break;
  }
  return chunks;
};

export const computeEmbedding = (text) => {
  const keywords = extractKeywords(text);
  return keywords.map((_, i) => Math.sin(i + 1) * 0.5);
};

export const cosineSimilarity = (a, b) => {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const vectorSearch = async (embedding, documentId, limit = 5) => {
  const query = { embedding: { $exists: true, $ne: [] } };
  if (documentId) query.document_id = documentId;
  const chunks = await DocumentChunk.find(query).lean();
  return chunks
    .map((c) => ({ ...c, score: cosineSimilarity(embedding, c.embedding || []) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

export const keywordSearch = async (keywords, documentId) => {
  const query = { keywords: { $in: keywords } };
  if (documentId) query.document_id = documentId;
  return await DocumentChunk.find(query);
};

export const ingestDocument = async (documentId, text) => {
  const chunks = chunkText(text);
  const savedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    const keywords = extractKeywords(chunks[i]);
    const embedding = computeEmbedding(chunks[i]);
    const doc = await DocumentChunk.create({
      document_id: documentId,
      chunk_index: i,
      content: chunks[i],
      embedding,
      keywords,
      token_count: chunks[i].split(/\s+/).length,
    });
    savedChunks.push(doc);
    chunkHashMap.set(`${documentId}:${i}`, doc);
    keywords.forEach((kw) => {
      if (!keywordIndexMap.has(kw)) keywordIndexMap.set(kw, new Set());
      keywordIndexMap.get(kw).add(doc._id.toString());
    });
  }
  return savedChunks;
};

export const hybridQuery = async (query, documentId, limit = 5, userId = null, chatId = null) => {
  const keywords = extractKeywords(query);
  const embedding = computeEmbedding(query);

  const [vectorResults, keywordResults, memoryContext] = await Promise.all([
    vectorSearch(embedding, documentId, limit),
    keywordSearch(keywords, documentId),
    userId ? buildFullContext(userId, chatId, query, 10, 5) : Promise.resolve(""),
  ]);

  // Merge short-term + long-term memory into results
  const scoreMap = new Map();
  vectorResults.forEach((r) => {
    scoreMap.set(r._id.toString(), { ...r, score: r.score * 0.6 });
  });
  keywordResults.forEach((r) => {
    const id = r._id.toString();
    const existing = scoreMap.get(id);
    if (existing) {
      existing.score += 0.4;
    } else {
      scoreMap.set(id, { ...r.toObject(), score: 0.4 });
    }
  });

  // Append memory-augmented results (factual context)
  let memoryResults = [];
  if (userId) {
    const relevant = await getRelevantMemories(userId, query, 3);
    memoryResults = relevant.map((m) => ({
      type: "memory",
      memory_type: m.memory_type,
      content: m.content,
      confidence: m.confidence,
      score: m.relevance || 0,
    }));
  }

  const documentResults = Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    document_results: documentResults,
    memory_context: memoryContext,
    memory_results: memoryResults,
    total: documentResults.length + memoryResults.length,
  };
};

export const deleteDocumentData = async (documentId) => {
  await deleteNodesByDocument(documentId);
  await deleteEdgesByDocument(documentId);
  await DocumentChunk.deleteMany({ document_id: documentId });
  return { message: "Document data deleted" };
};

export const getRAGStats = async () => {
  const [chunkCount, docCount, graphStats] = await Promise.all([
    DocumentChunk.countDocuments(),
    Document.countDocuments(),
    getGraphStats(),
  ]);
  return { chunkCount, docCount, ...graphStats };
};
