import DocumentChunk from "../document/documentChunk.model.js";
import Document from "../document/document.schema.js";
import {
  deleteNodesByDocument,
  deleteEdgesByDocument,
  upsertNode,
  upsertEdge,
  getGraphStats,
} from "../knowledge-graph/knowledgeGraph.service.js";
import {
  buildFullContext,
  getRelevantMemories,
} from "../memory/memory.service.js";
import { isLLMConfigured } from "../../utils/llm.utils.js";
import searchService from "../../services/search.service.js";
import { enqueueDocument } from "../../workers/rag.worker.js";

export const hybridQuery = async (query, documentId, limit = 5, userId = null, chatId = null, organizationId = null) => {
  const results = await searchService.hybridSearch(query, organizationId, {
    topK: limit,
    threshold: 0.5,
  });

  let memoryContext = "";
  let memoryResults = [];
  if (userId) {
    memoryContext = await buildFullContext(userId, chatId, query, 10, 5);
    const relevant = await getRelevantMemories(userId, query, 3);
    memoryResults = relevant.map((m) => ({
      type: "memory",
      memory_type: m.memory_type,
      content: m.content,
      confidence: m.confidence,
      score: m.relevance || 0,
    }));
  }

  return {
    document_results: results,
    memory_context: memoryContext,
    memory_results: memoryResults,
    total: results.length + memoryResults.length,
  };
};

export const ingestViaWorker = async (documentId, organizationId, fileBuffer, mimetype) => {
  await enqueueDocument(documentId, organizationId, fileBuffer, mimetype);
  return { message: "Document queued for RAG processing" };
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
  let chunkCount, docCount, graphStats;
  if (organizationId) {
    const orgDocs = await Document.find({ organization_id: organizationId, is_deleted: { $ne: true } }).select("_id").lean();
    const docIds = orgDocs.map((d) => d._id);
    chunkCount = await DocumentChunk.countDocuments({ document_id: { $in: docIds } });
    docCount = orgDocs.length;
    graphStats = await getGraphStats();
  } else {
    [chunkCount, docCount, graphStats] = await Promise.all([
      DocumentChunk.countDocuments(),
      Document.countDocuments({ is_deleted: { $ne: true } }),
      getGraphStats(),
    ]);
  }

  return { chunkCount, docCount, ...graphStats };
};
