import DocumentChunk from "../document/documentChunk.schema.js";
import Document from "../document/document.schema.js";
import {
  deleteNodesByDocument,
  deleteEdgesByDocument,
  upsertNode,
  upsertEdge,
  findNodesByDocument,
  bfsTraversal,
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
import {
  generateBatchEmbeddings,
  generateEmbedding,
  isLLMConfigured,
} from "../../utils/llm.utils.js";
import env from "../../config/env.js";

export const extractKeywords = (text) => {
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for", "of", "and", "or", "but", "i", "my", "me", "we", "you", "he", "she", "it", "they", "do", "does", "did", "have", "has", "had", "am", "be", "been", "being", "this", "that", "with", "from", "by", "as", "so", "no", "not", "if"]);
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
};

export const chunkText = (text, chunkSize, overlap) => {
  chunkSize = chunkSize || env.RAG.CHUNK_SIZE;
  overlap = overlap || env.RAG.CHUNK_OVERLAP;
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
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const DIM = env.RAG.EMBED_DIM || 256;
  const vec = new Array(DIM).fill(0);
  words.forEach((word, i) => {
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash + word.charCodeAt(j)) | 0;
    }
    const idx = Math.abs(hash % DIM);
    vec[idx] += 1 / (i + 1);
  });
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (mag > 0) vec.forEach((_, i) => (vec[i] /= mag));
  return vec;
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

export const vectorSearch = async (embedding, documentId, organizationId, limit = 5) => {
  const query = { embedding: { $exists: true, $ne: [] } };
  if (documentId) query.document_id = documentId;
  if (organizationId) {
    const orgDocs = await Document.find({ organization_id: organizationId }).select("_id").lean();
    query.document_id = { $in: orgDocs.map((d) => d._id) };
  }
  const chunks = await DocumentChunk.find(query).lean();
  return chunks
    .map((c) => ({ ...c, score: cosineSimilarity(embedding, c.embedding || []) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

export const keywordSearch = async (keywords, documentId, organizationId) => {
  const query = { keywords: { $in: keywords } };
  if (documentId) query.document_id = documentId;
  if (organizationId) {
    const orgDocs = await Document.find({ organization_id: organizationId }).select("_id").lean();
    query.document_id = { $in: orgDocs.map((d) => d._id) };
  }
  return await DocumentChunk.find(query);
};

export const ingestDocument = async (documentId, text) => {
  const chunks = chunkText(text);
  const savedChunks = [];

  let embeddings;
  if (isLLMConfigured()) {
    try {
      embeddings = await generateBatchEmbeddings(chunks);
    } catch {
      embeddings = chunks.map((c) => computeEmbedding(c));
    }
  } else {
    embeddings = chunks.map((c) => computeEmbedding(c));
  }

  for (let i = 0; i < chunks.length; i++) {
    const keywords = extractKeywords(chunks[i]);
    const doc = await DocumentChunk.create({
      document_id: documentId,
      chunk_index: i,
      content: chunks[i],
      embedding: embeddings[i],
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

export const hybridQuery = async (query, documentId, limit = 5, userId = null, chatId = null, organizationId = null) => {
  const keywords = extractKeywords(query);

  let embedding;
  if (isLLMConfigured()) {
    try {
      embedding = await generateEmbedding(query);
    } catch {
      embedding = computeEmbedding(query);
    }
  } else {
    embedding = computeEmbedding(query);
  }

  const [vectorResults, keywordResults, memoryContext] = await Promise.all([
    vectorSearch(embedding, documentId, organizationId, limit),
    keywordSearch(keywords, documentId, organizationId),
    userId ? buildFullContext(userId, chatId, query, 10, 5) : Promise.resolve(""),
  ]);

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

export const fullPipeline = async (documentId, text) => {
  const chunks = await ingestDocument(documentId, text);

  await buildKnowledgeGraph(documentId, text);

  return {
    chunksCreated: chunks.length,
    graphBuilt: true,
  };
};

export const buildKnowledgeGraph = async (documentId, text) => {
  let entities;
  if (isLLMConfigured()) {
    try {
      const { extractEntitiesFromText } = await import("../../utils/llm.utils.js");
      entities = await extractEntitiesFromText(text);
    } catch {
      entities = extractEntitiesLocal(text);
    }
  } else {
    entities = extractEntitiesLocal(text);
  }

  const nodeMap = new Map();

  for (const entity of entities) {
    const node = await upsertNode({
      document_id: documentId,
      entity_name: entity.entity_name,
      entity_type: entity.entity_type || "Concept",
      metadata: {
        weight: entity.weight || 1,
        source_text: text.substring(0, 500),
      },
    });
    nodeMap.set(entity.entity_name.toLowerCase(), node);
  }

  for (const entity of entities) {
    if (entity.relationships && entity.relationships.length > 0) {
      const sourceNode = nodeMap.get(entity.entity_name.toLowerCase());
      if (!sourceNode) continue;

      for (const rel of entity.relationships) {
        const targetNode = nodeMap.get(rel.target?.toLowerCase());
        if (targetNode) {
          await upsertEdge({
            source_id: sourceNode._id,
            target_id: targetNode._id,
            relationship: rel.relationship || "related_to",
            weight: rel.weight || 0.5,
            document_id: documentId,
          });
        }
      }
    }
  }

  const nodes = Array.from(nodeMap.values());
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < Math.min(nodes.length, i + 4); j++) {
      const existingEdges = await import("./hashmap.service.js");
      await upsertEdge({
        source_id: nodes[i]._id,
        target_id: nodes[j]._id,
        relationship: "co_occurs_with",
        weight: 0.3,
        document_id: documentId,
      });
    }
  }

  return nodes;
};

function extractEntitiesLocal(text) {
  const entities = [];
  const words = text.split(/\s+/);
  const wordCounts = {};

  words.forEach((w) => {
    const clean = w.replace(/[^\w]/g, "").toLowerCase();
    if (clean.length > 3) {
      wordCounts[clean] = (wordCounts[clean] || 0) + 1;
    }
  });

  const sorted = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  sorted.forEach(([word, count]) => {
    entities.push({
      entity_name: word,
      entity_type: "Concept",
      relationships: [],
      weight: Math.min(count / 3, 1),
    });
  });

  return entities;
}

export const deleteDocumentData = async (documentId) => {
  await deleteNodesByDocument(documentId);
  await deleteEdgesByDocument(documentId);
  await DocumentChunk.deleteMany({ document_id: documentId });
  return { message: "Document data deleted" };
};

export const getRAGStats = async (organizationId) => {
  const matchQuery = organizationId ? {} : {};

  let chunkCount, docCount, graphStats;
  if (organizationId) {
    const orgDocs = await Document.find({ organization_id: organizationId }).select("_id").lean();
    const docIds = orgDocs.map((d) => d._id);
    chunkCount = await DocumentChunk.countDocuments({ document_id: { $in: docIds } });
    docCount = orgDocs.length;
    graphStats = await getGraphStats();
  } else {
    [chunkCount, docCount, graphStats] = await Promise.all([
      DocumentChunk.countDocuments(),
      Document.countDocuments(),
      getGraphStats(),
    ]);
  }

  return { chunkCount, docCount, ...graphStats };
};
