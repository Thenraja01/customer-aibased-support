import DocumentChunk from "../document/documentChunk.schema.js";
import Document from "../document/document.schema.js";
import DocumentRoleAccess from "../document/documentRoleAccess.schema.js";
import Organization from "../organization/organization.schema.js";
import Branch from "../branch/branch.schema.js";
import GraphEntity from "../chat/graphEntity.schema.js";
import GraphNode from "../graph/graphNode.schema.js";
import GraphRelationship from "../graph/graphRelationship.schema.js";
import mongoose from "mongoose";
import {
  chunkHashMap,
  keywordIndexMap,
} from "./hashmap.service.js";

import { logger } from "../../utils/logger.js";

export const getRagConfig = async (organizationId, branchId) => {
  let config = {
    chunk_size: 512,
    chunk_overlap: 50,
    embedding_model: 'nomic-embed-text',
    vector_store: 'mongodb'
  };

  if (branchId) {
    const branch = await Branch.findById(branchId).lean();
    if (branch?.rag_config) {
      config = { ...config, ...branch.rag_config };
    }
  }

  if (organizationId) {
    const org = await Organization.findById(organizationId).lean();
    if (org?.rag_config) {
      config = { ...config, ...org.rag_config };
    }
  }
  return config;
};
import {
  buildFullContext,
  appendToShortTerm,
  getRelevantMemories,
} from "../memory/memory.service.js";
import { getEmbedding } from "../../services/embedding.service.js";
import { getCachedEmbedding, getCachedEmbeddingBatch } from "../../services/embeddingCache.service.js";
import { normalizeRoleName, isNormalizedAdminRole } from "../../utils/constants.js";

// ── Keyword utilities ────────────────────────────────────────────────

const FALLBACK_STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "in", "on", "at", "to", "for", "of", "and", "or", "but", "so", "with",
  "by", "from", "up", "about", "into", "through", "after", "before",
  "hey", "hi", "hello", "what", "where", "when", "how", "why", "who", "which",
  "can", "could", "would", "should", "will", "shall", "may", "might",
  "please", "tell", "give", "show", "me", "you", "your", "our", "my", "this", "that", "these", "those"
]);

const STEM_MAP = {
  shipping: ["ship", "shipment", "shipments", "shipped", "shipping"],
  shipment: ["ship", "shipment", "shipments", "shipped", "shipping"],
  shipments: ["ship", "shipment", "shipments", "shipped", "shipping"],
  shipped: ["ship", "shipment", "shipments", "shipped", "shipping"],
  tracking: ["track", "tracking", "tracked"],
  tracked: ["track", "tracking", "tracked"],
  orders: ["order", "orders", "ordering"],
  ordering: ["order", "orders", "ordering"],
  returns: ["return", "returns", "returning"],
  returning: ["return", "returns", "returning"],
  payments: ["pay", "payment", "payments", "paying"],
  payment: ["pay", "payment", "payments", "paying"],
  timing: ["time", "times", "timing"],
  times: ["time", "times", "timing"],
  warranty: ["warranty", "warranties", "claim", "claims", "claiming"],
  warranties: ["warranty", "warranties", "claim", "claims"],
  warrenty: ["warranty", "warranties", "claim", "claims", "claiming"],
  claiming: ["claim", "claims", "claimed", "claiming", "warranty"],
  claims: ["claim", "claims", "claimed", "claiming", "warranty"],
  claim: ["claim", "claims", "claimed", "claiming", "warranty"],
  refund: ["refund", "refunds", "refunded", "refunding"],
  refunds: ["refund", "refunds", "refunded", "refunding"],
  complaint: ["complaint", "complaints", "grievance", "redressal"],
  complaints: ["complaint", "complaints", "grievance", "redressal"],
  troubleshooting: ["troubleshoot", "troubleshooting", "diagnostics", "diagnostic", "error"],
  security: ["security", "2fa", "authentication", "password"],
};

const fallbackExtractKeywords = (text) => {
  const rawWords = (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !FALLBACK_STOP_WORDS.has(w));

  const expanded = new Set();
  for (const w of rawWords) {
    expanded.add(w);
    if (STEM_MAP[w]) {
      STEM_MAP[w].forEach((stem) => expanded.add(stem));
    }
    // Morphological stripping: -ing, -ies, -ed, -s
    if (w.endsWith("ing") && w.length > 4) {
      expanded.add(w.slice(0, -3));
    }
    if (w.endsWith("ed") && w.length > 4) {
      expanded.add(w.slice(0, -2));
    }
    if (w.endsWith("ies") && w.length > 4) {
      expanded.add(w.slice(0, -3) + "y");
    }
    if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) {
      expanded.add(w.slice(0, -1));
    }
  }
  return Array.from(expanded);
};

export const extractKeywords = (text) => fallbackExtractKeywords(text);

// ── Text chunking ────────────────────────────────────────────────────

export const chunkTextSemantic = (text, minChunkSize = 300, maxChunkSize = 800) => {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = "";

  for (let paragraph of paragraphs) {
    paragraph = paragraph.trim();
    if (!paragraph) continue;

    if (currentChunk.length + paragraph.length <= maxChunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    } else {
      if (currentChunk.length >= minChunkSize) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        const sentences = paragraph.split(/(?<=[.?!])\s+/);
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length <= maxChunkSize) {
            currentChunk += (currentChunk ? " " : "") + sentence;
          } else {
            chunks.push(currentChunk);
            currentChunk = sentence;
          }
        }
      }
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  if (chunks.length === 0 && text.trim().length > 0) {
    chunks.push(text.trim());
  }
  return chunks;
};

export const chunkText = (text, chunkSize = 500, overlap = 50) => {
  return chunkTextSemantic(text, chunkSize - overlap, chunkSize + overlap);
};
export const computeEmbedding = async (text) => {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return null;
  }
  const embedding = await getCachedEmbedding(text);
  // getCachedEmbedding already returns null if Ollama is down
  return embedding ?? null;
};

export const computeEmbeddingBatch = async (texts) => {
  const results = await getCachedEmbeddingBatch(texts);
  // Each entry is either a real embedding or null
  return results;
};
export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
};

// ── Role access helpers ──────────────────────────────────────────────

export const getRoleFilter = (roleName) => {
  if (!roleName) return null;
  const normalizedRole = normalizeRoleName(roleName);
  if (isNormalizedAdminRole(normalizedRole)) return null;
  return { $in: [normalizedRole, "all", "public"] };
};

export const vectorSearch = async (
  embedding,
  organizationId,
  documentId,
  limit = 5,
  roleName = null,
  statusFilter = "published",
  authorizedDocIds = null,
  branchId = null
) => {
  if (!embedding || !Array.isArray(embedding) || embedding.length === 0) return [];

  const normalizedRole = roleName ? normalizeRoleName(roleName) : null;
  const isAdmin = normalizedRole && (isNormalizedAdminRole(normalizedRole) || normalizedRole === "super_admin");

  try {
    const mongoQuery = {};
    if (organizationId) mongoQuery.organization_id = new mongoose.Types.ObjectId(organizationId);

    if (branchId) {
      mongoQuery.$or = [{ branch_id: new mongoose.Types.ObjectId(branchId) }, { branch_id: null }, { branch_id: { $exists: false } }];
    } else if (!isAdmin) {
      mongoQuery.branch_id = null;
    }

    if (authorizedDocIds && authorizedDocIds.length > 0) {
      const docObjIds = authorizedDocIds.map((id) => new mongoose.Types.ObjectId(id));
      if (documentId) {
        docObjIds.push(new mongoose.Types.ObjectId(documentId));
      }
      mongoQuery.document_id = { $in: docObjIds };
    } else if (documentId) {
      mongoQuery.document_id = new mongoose.Types.ObjectId(documentId);
    }

    if (statusFilter) {
      if (statusFilter === "published") {
        mongoQuery.status = { $in: ["published", "approved", "ready_for_review", "uploaded", "completed"] };
      } else {
        mongoQuery.status = statusFilter;
      }
    }

    // Role-based access control filters
    if (roleName && !isAdmin) {
      mongoQuery.$or = [
        { assigned_role: "all" },
        { assigned_role: normalizedRole },
        { allowedRoles: { $in: [normalizedRole, roleName] } },
        { customerVisible: true },
      ];
    }

    mongoQuery.embedding = { $exists: true, $ne: [] };

    const chunks = await DocumentChunk.find(mongoQuery)
      .select("_id content chunk_index token_count embedding document_id status visibility allowedRoles topics")
      .lean();

    if (!chunks || chunks.length === 0) return [];

    // Native in-memory vector cosine similarity ranking
    const scoredChunks = chunks
      .map((c) => ({
        ...c,
        score: cosineSimilarity(embedding, c.embedding),
      }))
      .filter((c) => !isNaN(c.score) && c.score >= 0.4)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredChunks;
  } catch (err) {
    console.error("[MongoDB VectorSearch] Query error:", err.message);
    return [];
  }
};

// ── Keyword helpers ──────────────────────────────────────────────────

const levenshteinDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

const fuzzyMatch = (query, target, maxDistance = 2) => {
  if (target.includes(query)) return 1;
  if (query.length < 3) return 0;
  const distance = levenshteinDistance(query, target);
  return distance <= maxDistance ? 1 - distance / Math.max(query.length, target.length) : 0;
};

const scoreKeywordMatch = (keywords, chunkKeywords = [], content = "") => {
  if (!keywords || keywords.length === 0) return 0;
  let score = 0;
  const lowerContent = (content || "").toLowerCase();

  for (const kw of keywords) {
    const lowerKw = kw.toLowerCase();
    let kwScore = 0;
    if (chunkKeywords && chunkKeywords.some((ck) => ck.toLowerCase() === lowerKw)) {
      kwScore += 1.0;
    } else if (chunkKeywords && chunkKeywords.some((ck) => fuzzyMatch(lowerKw, ck.toLowerCase()) > 0.6)) {
      kwScore += 0.6;
    }
    if (lowerContent.includes(lowerKw)) {
      kwScore += 0.6;
    }
    if (kwScore > 0) {
      score += kwScore;
    }
  }
  const baseDenominator = Math.min(keywords.length, Math.max(2, Math.ceil(keywords.length * 0.4)));
  return Math.min(1.0, score / baseDenominator);
};

export const keywordSearch = async (
  keywords,
  organizationId,
  documentId,
  roleName = null,
  statusFilter = "published",
  authorizedDocIds = null,
  branchId = null
) => {
  if (!keywords || keywords.length === 0) return [];
  if (mongoose.connection.readyState !== 1) {
    return [];
  }

  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const query = {
    $and: [
      {
        $or: [
          { keywords: { $in: keywords } },
          { content: { $regex: escaped.join("|"), $options: "i" } },
        ],
      },
    ],
  };

  if (organizationId) query.organization_id = organizationId;
  if (branchId) {
    query.$and.push({
      $or: [
        { branch_id: branchId },
        { branch_id: null },
        { branch_id: { $exists: false } },
        { visibility: "organization" },
        { visibility: "public" },
      ],
    });
  } else {
    query.$and.push({
      $or: [
        { branch_id: null },
        { branch_id: { $exists: false } },
        { visibility: "organization" },
        { visibility: "public" },
        { branch_id: { $ne: null } },
      ],
    });
  }
  if (statusFilter) {
    if (statusFilter === "published") {
      query.status = { $in: ["published", "approved", "ready_for_review", "uploaded", "completed"] };
    } else {
      query.status = statusFilter;
    }
  }
  if (roleName) {
    const normalizedRole = normalizeRoleName(roleName);
    const isAdmin = isNormalizedAdminRole(normalizedRole) || normalizedRole === "super_admin";
    if (!isAdmin) {
      const roleVariants = [
        normalizedRole,
        "all",
        "All",
        "public",
        "Public",
        normalizedRole.toLowerCase(),
        normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1),
      ];
      query.$and.push({
        $or: [
          { allowed_roles: { $in: roleVariants } },
          { allowedRoles: { $in: roleVariants } },
          { assigned_role: { $in: roleVariants } },
          { assignedRole: { $in: roleVariants } },
          { role: { $in: roleVariants } },
        ],
      });
    }
  }

  // Merge documentId and authorizedDocIds (BUG FIX: no silent overwrite)
  if (documentId && authorizedDocIds) {
    const docIdStr = documentId.toString();
    const merged = authorizedDocIds.includes(docIdStr)
      ? authorizedDocIds
      : [...authorizedDocIds, docIdStr];
    query.document_id = { $in: merged };
  } else if (authorizedDocIds) {
    query.document_id = { $in: authorizedDocIds };
  } else if (documentId) {
    query.document_id = documentId;
  }

  const chunks = await DocumentChunk.find(query).lean();
  return chunks
    .map((c) => ({
      ...c,
      score: scoreKeywordMatch(keywords, c.keywords || [], c.content),
    }))
    .sort((a, b) => b.score - a.score);
};

// ── Graph RAG search ─────────────────────────────────────────────────

export const graphSearch = async (
  queryText,
  organizationId,
  roleName = null,
  statusFilter = "published",
  authorizedDocIds = null,
  branchId = null
) => {
  if (!queryText || !organizationId) return [];

  try {
    const lowerQuery = queryText.toLowerCase();
    const graphKeywords = new Set();
    
    // Dynamically extract keywords from query text
    const extracted = extractKeywords(queryText);
    extracted.forEach(kw => {
      if (kw && kw.trim()) {
        graphKeywords.add(kw.trim().toLowerCase());
      }
    });

    const regexes = Array.from(graphKeywords).map(kw => new RegExp(`^${kw}$`, "i"));
    if (regexes.length === 0) return [];

    const matchedEntities = await GraphNode.find({
      organization_id: organizationId,
      type: "entity",
      name: { $in: regexes }
    }).select("name").lean();

    const entityNames = matchedEntities.map(e => e.name);
    if (entityNames.length === 0) return [];

    // Find chunk relationships mapping to these entities
    const relQuery = {
      organization_id: organizationId,
      target_name: { $in: entityNames },
      type: "HAS_ENTITY"
    };

    if (authorizedDocIds && authorizedDocIds.length > 0) {
      relQuery.document_id = { $in: authorizedDocIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const relations = await GraphRelationship.find(relQuery).select("source_name").lean();
    const chunkNames = relations.map(r => r.source_name);
    if (chunkNames.length === 0) return [];

    const chunkNodes = await GraphNode.find({
      organization_id: organizationId,
      type: "chunk",
      name: { $in: chunkNames }
    }).select("ref_id").lean();

    const chunkIds = chunkNodes.map(cn => cn.ref_id).filter(Boolean);
    if (chunkIds.length === 0) return [];

    const chunkQuery = {
      _id: { $in: chunkIds },
      status: statusFilter,
    };

    if (branchId) {
      chunkQuery.$or = [
        { branch_id: branchId },
        { branch_id: null }
      ];
    } else {
      chunkQuery.branch_id = null;
    }
    
    if (roleName) {
      const normalizedRole = normalizeRoleName(roleName);
      const isAdmin = isNormalizedAdminRole(normalizedRole) || normalizedRole === "super_admin";
      if (!isAdmin) {
        chunkQuery.allowedRoles = normalizedRole;
      }
    }

    const chunks = await DocumentChunk.find(chunkQuery).lean();
    return chunks.map(c => ({
      ...c,
      score: scoreKeywordMatch(extracted, c.keywords || [], c.content) * 0.5 + 0.3
    })).sort((a, b) => b.score - a.score);

  } catch (err) {
    console.error("[Graph RAG] Search failed:", err.message);
    return [];
  }
};

export const clearDocumentVectors = async (documentId, documentVersionId = null) => {
  if (!documentId) return;
  try {
    const query = { document_id: new mongoose.Types.ObjectId(documentId) };
    if (documentVersionId) {
      query.documentVersionId = new mongoose.Types.ObjectId(documentVersionId);
    }
    await DocumentChunk.deleteMany(query);
  } catch (err) {
    console.warn(`[MongoDB Vector] Failed to clear vectors for document ${documentId}:`, err.message);
  }
};

/**
 * Ingest a document into the Native MongoDB vector store.
 * High-Speed batch embedding generation + bulk insert in < 10ms.
 */
export const ingestDocument = async (
  documentId,
  organizationId,
  branchId,
  assignedRole,
  text,
  status = "pending",
  visibility = "branch",
  customerVisible = false,
  allowedRoles = ["branch_admin", "support"],
  documentVersionId = null,
  topics = []
) => {
  const normalizedRole = (assignedRole || "all").toLowerCase();
  
  const ragConfig = await getRagConfig(organizationId, branchId);
  const chunks = chunkText(text, ragConfig.chunk_size, ragConfig.chunk_overlap);
  
  // Phase 1 — compute all embeddings concurrently
  const embeddings = await getCachedEmbeddingBatch(chunks);

  // Phase 2 — safe to replace: clear previous version chunks & graph
  await clearDocumentVectors(documentId, documentVersionId);
  try {
    const { clearDocumentGraph } = await import("../../services/mongodbGraph.service.js");
    await clearDocumentGraph(documentId);
  } catch (err) {
    console.warn(`[GraphRAG] Failed to pre-clear graph for document ${documentId}:`, err.message);
  }

  const docsToInsert = chunks.map((chunkContent, i) => {
    const keywords = extractKeywords(chunkContent);
    const embedding = embeddings[i] || [];

    return {
      document_id: documentId,
      organization_id: organizationId,
      branch_id: branchId,
      assigned_role: normalizedRole,
      status: status || "pending",
      visibility,
      customerVisible,
      allowedRoles,
      chunk_index: i,
      content: chunkContent,
      embedding,
      keywords,
      token_count: chunkContent.split(/\s+/).length,
      documentVersionId,
      topics: topics,
    };
  });

  const savedChunks = await DocumentChunk.insertMany(docsToInsert);

  savedChunks.forEach((doc, i) => {
    chunkHashMap.set(`${documentId}:${i}`, doc);
    (doc.keywords || []).forEach((kw) => {
      if (!keywordIndexMap.has(kw)) keywordIndexMap.set(kw, new Set());
      keywordIndexMap.get(kw).add(doc._id.toString());
    });
  });

  // Trigger MongoDB Graph Ingestion directly in background
  try {
    const { ingestDocumentGraph } = await import("../../services/mongodbGraph.service.js");
    await ingestDocumentGraph(documentId, organizationId, branchId, savedChunks, topics);
    console.log(`[GraphRAG] Ingested document graph for document ${documentId}`);
  } catch (err) {
    console.error(`[GraphRAG] Graph ingestion failed for document ${documentId}:`, err.message);
  }

  return savedChunks;
};


export const traceRetrievalDebug = async (
  queryText,
  organizationId,
  roleName,
  branchId,
  vectorResults,
  keywordResults,
  graphResults,
  finalResults
) => {
  try {
    const normalizedRole = normalizeRoleName(roleName);
    const isAdmin = isNormalizedAdminRole(normalizedRole) || normalizedRole === "super_admin";

    console.log(`[RAG TRACE] 1. Authenticated User Role: ${roleName}`);
    console.log(`[RAG TRACE] 2. Authenticated Organization ID: ${organizationId}`);
    console.log(`[RAG TRACE] 3. Authenticated Branch ID: ${branchId}`);

    const docsOrg = await Document.find({ organization_id: organizationId }).select("_id").lean();
    console.log(`[RAG TRACE] 4. Documents matching organization: ${docsOrg.length}`);

    const branchFilter = branchId 
      ? { $or: [{ branch_id: branchId }, { branch_id: null }] } 
      : { branch_id: null };
    const docsBranch = await Document.find({ organization_id: organizationId, ...branchFilter }).select("_id").lean();
    console.log(`[RAG TRACE] 5. Documents matching branch scope: ${docsBranch.length}`);

    const rbacFilter = isAdmin ? {} : { allowed_roles: normalizedRole };
    const docsRbac = await Document.find({ organization_id: organizationId, ...branchFilter, ...rbacFilter }).select("_id").lean();
    console.log(`[RAG TRACE] 6. Documents matching RBAC: ${docsRbac.length}`);

    const docsStatus = await Document.find({ organization_id: organizationId, ...branchFilter, ...rbacFilter, status: "published" }).select("_id").lean();
    console.log(`[RAG TRACE] 7. Documents matching published status: ${docsStatus.length}`);

    const docsVersion = await Document.find({ organization_id: organizationId, ...branchFilter, ...rbacFilter, status: "published", currentVersionId: { $ne: null } }).select("_id").lean();
    console.log(`[RAG TRACE] 8. Documents matching current version: ${docsVersion.length}`);

    console.log(`[RAG TRACE] 9. Vector search candidate count: ${vectorResults.length}`);
    console.log(`[RAG TRACE] 10. Keyword search candidate count: ${keywordResults.length}`);
    console.log(`[RAG TRACE] 11. Graph search candidate count: ${graphResults.length}`);
    console.log(`[RAG TRACE] 12. Final candidate count: ${finalResults.length}`);

    const keywords = extractKeywords(queryText);
    const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const rawChunks = await DocumentChunk.find({
      organization_id: organizationId,
      $or: [
        { keywords: { $in: keywords } },
        { content: { $regex: escaped.join("|"), $options: "i" } }
      ]
    }).select("_id document_id branch_id status allowedRoles documentVersionId").lean();

    console.log(`[RAG TRACE] Analyzing ${rawChunks.length} raw candidates for rejection reason...`);
    const finalIds = new Set(finalResults.map(r => r._id.toString()));

    for (const chunk of rawChunks) {
      const chunkIdStr = chunk._id.toString();
      if (finalIds.has(chunkIdStr)) {
        continue;
      }

      if (chunk.organization_id && chunk.organization_id.toString() !== organizationId.toString()) {
        console.log(`[RAG TRACE] Chunk ${chunkIdStr} rejected by: ORGANIZATION FILTER (expected ${organizationId}, got ${chunk.organization_id})`);
        continue;
      }

      if (branchId) {
        if (chunk.branch_id && chunk.branch_id.toString() !== branchId.toString()) {
          console.log(`[RAG TRACE] Chunk ${chunkIdStr} rejected by: BRANCH FILTER (user branch ${branchId}, chunk branch ${chunk.branch_id})`);
          continue;
        }
      } else {
        if (chunk.branch_id !== null && chunk.branch_id !== undefined && chunk.branch_id !== "") {
          console.log(`[RAG TRACE] Chunk ${chunkIdStr} rejected by: BRANCH FILTER (user branch null, chunk branch ${chunk.branch_id})`);
          continue;
        }
      }

      const chunkAllowedRoles = chunk.allowedRoles || [];
      const hasAccess = isAdmin || chunkAllowedRoles.map(normalizeRoleName).includes(normalizedRole);
      if (!hasAccess) {
        console.log(`[RAG TRACE] Chunk ${chunkIdStr} rejected by: RBAC FILTER (user role ${normalizedRole}, allowed roles: [${chunkAllowedRoles.join(", ")}])`);
        continue;
      }

      if (!["published", "approved", "ready_for_review"].includes(chunk.status)) {
        console.log(`[RAG TRACE] Chunk ${chunkIdStr} rejected by: STATUS FILTER (chunk status: ${chunk.status}, expected: published/approved)`);
        continue;
      }

      if (!chunk.documentVersionId) {
        console.log(`[RAG TRACE] Chunk ${chunkIdStr} rejected by: VERSION FILTER (documentVersionId is null)`);
        continue;
      }

      console.log(`[RAG TRACE] Chunk ${chunkIdStr} rejected by: SCORE/LIMIT FILTER (normalized score too low or outside top limit)`);
    }

  } catch (err) {
    console.error("[RAG TRACE] Debug tracing failed:", err.message);
  }
};

export const hybridQuery = async (
  query,
  organizationId,
  documentId,
  limit = 5,
  userId = null,
  chatId = null,
  roleName = null,
  roleId = null,
  branchId = null
) => {
  if (!organizationId) {
    return { document_results: [], memory_context: "", memory_results: [], total: 0, authorized: false, reason: "no_org" };
  }

  const org = await Organization.findById(organizationId).select("status _id").lean();
  if (!org) {
    return { document_results: [], memory_context: "", memory_results: [], total: 0, authorized: false, reason: "org_not_found" };
  }
  if (org.status !== "active") {
    return { document_results: [], memory_context: "", memory_results: [], total: 0, authorized: false, reason: "org_inactive" };
  }

  const normalizedRole = roleName ? normalizeRoleName(roleName) : "public";
  const isAdmin = isNormalizedAdminRole(normalizedRole) || normalizedRole === "super_admin";

  let authorizedDocIds = null;
  if (!isAdmin) {
    const accessDocIds = await getAuthorizedDocumentIds(organizationId, roleName, branchId);
    authorizedDocIds = accessDocIds;
    if (authorizedDocIds.length === 0) {
      return { document_results: [], memory_context: "", memory_results: [], total: 0, authorized: false, reason: "role_not_authorized" };
    }
  }

  const keywords = extractKeywords(query);
  const embedding = await computeEmbedding(query);

  if (!embedding) {
    console.warn("[RAG] hybridQuery: Ollama unavailable — skipping vector search, using keyword-only");
  }

  const [vectorResults, keywordResults, graphResults, memoryContext] = await Promise.all([
    embedding
      ? vectorSearch(embedding, organizationId, documentId, limit, roleName, "published", authorizedDocIds, branchId)
      : Promise.resolve([]),
    keywordSearch(keywords, organizationId, documentId, roleName, "published", authorizedDocIds, branchId),
    graphSearch(query, organizationId, roleName, "published", authorizedDocIds, branchId),
    userId ? buildFullContext(userId, chatId, query, 10, 5) : Promise.resolve(""),
  ]);

  const scoreMap = new Map();
  vectorResults.forEach((r) => { scoreMap.set(r._id.toString(), { ...r, score: (r.score || 0) * 0.5 }); });
  const keywordWeight = vectorResults.length > 0 ? 0.65 : 0.9;
  keywordResults.forEach((r) => {
    const id = r._id.toString();
    const existing = scoreMap.get(id);
    if (existing) {
      existing.score = Math.max(existing.score, r.score * keywordWeight) + (r.score * 0.35);
    } else {
      scoreMap.set(id, { ...r, score: r.score * keywordWeight });
    }
  });
  graphResults.forEach((r) => {
    const id = r._id.toString();
    const existing = scoreMap.get(id);
    if (existing) {
      existing.score += (r.score || 0) * 0.25;
    } else {
      scoreMap.set(id, { ...r, score: (r.score || 0) * 0.25 });
    }
  });

  let memoryResults = [];
  if (userId) {
    const relevant = await getRelevantMemories(userId, query, 3, organizationId);
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
    authorized: true,
    reason: null,
  };
};

// ── Access verification ──────────────────────────────────────────────

export const verifyAccess = async (organizationId, roleName, roleId, branchId = null) => {
  if (!organizationId) {
    return { authorized: false, reason: "no_org", accessScope: null };
  }

  const org = await Organization.findById(organizationId).select("status _id").lean();
  if (!org) {
    return { authorized: false, reason: "org_not_found", accessScope: null };
  }
  if (org.status !== "active") {
    return { authorized: false, reason: "org_inactive", accessScope: null };
  }

  const normalizedRole = normalizeRoleName(roleName);
  const isAdmin = isNormalizedAdminRole(normalizedRole) || normalizedRole === "super_admin";
  const effectiveBranchId = isAdmin ? null : branchId;

  const authorizedDocIds = await getAuthorizedDocumentIds(organizationId, roleName, effectiveBranchId);
  const orgHasKnowledgeBase = await hasApprovedDocuments(organizationId);

  let isAuthorized = true;
  let reason = null;

  if (!isAdmin && authorizedDocIds.length === 0 && orgHasKnowledgeBase) {
    isAuthorized = false;
    reason = "role_not_authorized";
  }

  const accessScope = {
    roleName: roleName,
    roleFilter: getRoleFilter(roleName),
    authorizedDocumentIds: authorizedDocIds,
    statusFilter: "published",
    branchId: effectiveBranchId,
  };

  return {
    authorized: isAuthorized,
    reason,
    accessScope,
  };
};

// ── Scoped search (primary path used by aiChat) ──────────────────────

export const searchWithScope = async (
  query,
  organizationId,
  accessScope,
  limit = 5,
  userId = null,
  chatId = null
) => {
  const keywords = extractKeywords(query);

  // ── Optimization 3: Fast-Track Keyword Search with Early-Exit ──
  // Check fast in-memory keyword & direct title match first (~2-4ms).
  // If an exact high-confidence match (score >= 0.95) is found, return immediately without waiting for ChromaDB vector search.
  const keywordResults = await keywordSearch(
    keywords,
    organizationId,
    null,
    accessScope.roleName,
    accessScope.statusFilter,
    accessScope.authorizedDocumentIds,
    accessScope.branchId
  );

  const topKeywordScore = keywordResults.length > 0 ? (keywordResults[0].score || 0) : 0;
  const isDirectExactMatch = topKeywordScore >= 0.95 && keywordResults.length >= 1;

  let vectorResults = [];
  let graphResults = [];
  let graphContext = "";

  if (isDirectExactMatch) {
    // Short-circuit: High precision exact keyword match found!
    vectorResults = [];
    graphResults = [];
    graphContext = "";
  } else {
    // Standard Parallel Execution: Compute embedding and search Vector + Graph in parallel
    const embeddingPromise = computeEmbedding(query);
    const graphSearchPromise = graphSearch(
      query,
      organizationId,
      accessScope.roleName,
      accessScope.statusFilter,
      accessScope.authorizedDocumentIds,
      accessScope.branchId
    );
    const graphContextPromise = (async () => {
      try {
        const { retrieveGraphContext } = await import("../../services/mongodbGraph.service.js");
        return await retrieveGraphContext(query, organizationId, accessScope.branchId, accessScope.authorizedDocumentIds);
      } catch (err) {
        console.error("[GraphRAG] Failed to retrieve graph context:", err.message);
        return "";
      }
    })();

    const [embedding, graphRes, gContext] = await Promise.all([
      embeddingPromise,
      graphSearchPromise,
      graphContextPromise,
    ]);

    graphResults = graphRes;
    graphContext = gContext;

    if (embedding) {
      vectorResults = await vectorSearch(
        embedding,
        organizationId,
        null,
        limit,
        accessScope.roleName,
        accessScope.statusFilter,
        accessScope.authorizedDocumentIds,
        accessScope.branchId
      );
    }
  }

  const memoryContext = userId ? await buildFullContext(userId, chatId, query, 10, 5) : "";

  const { rerankResults } = await import("../chat/confidence.service.js");
  const reranked = rerankResults(vectorResults, keywordResults, graphResults, limit);

  const scoredResults = reranked.map((r) => ({
    ...r,
    score: r.score || r.normalizedScore * 0.5 || 0,
  }));

  // Log debug metrics
  await traceRetrievalDebug(
    query,
    organizationId,
    accessScope.roleName || "public",
    accessScope.branchId,
    vectorResults,
    keywordResults,
    graphResults,
    scoredResults
  );

  let memoryResults = [];
  if (userId) {
    const relevant = await getRelevantMemories(userId, query, 3, organizationId);
    memoryResults = relevant.map((m) => ({
      type: "memory",
      memory_type: m.memory_type,
      content: m.content,
      confidence: m.confidence,
      score: m.relevance || 0,
    }));
  }

  return {
    document_results: scoredResults,
    memory_context: memoryContext,
    memory_results: memoryResults,
    graph_context: graphContext,
    total: scoredResults.length + memoryResults.length,
    authorized: true,
    reason: null,
  };
};

// ── Authorized document IDs ──────────────────────────────────────────

export const getAuthorizedDocumentIds = async (organizationId, userRole, branchId = null) => {
  if (!organizationId) return [];

  const normalizedRole = normalizeRoleName(userRole);
  const isAdmin = isNormalizedAdminRole(normalizedRole) || normalizedRole === "super_admin";

  const query = {
    organization_id: organizationId,
    status: { $in: ["published", "approved", "ready_for_review", "uploaded", "processing", "completed"] },
  };

  if (!isAdmin) {
    const roleVariants = [normalizedRole, "all", "All", "public", "Public", "customer", "Customer"];
    query.$or = [
      { allowed_roles: { $in: roleVariants } },
      { assigned_role: { $in: roleVariants } },
      { visibility: "public" },
      { visibility: "organization" },
    ];
    if (branchId) {
      query.$and = [
        {
          $or: [
            { branch_id: branchId },
            { branch_id: null },
            { visibility: "organization" },
            { visibility: "public" },
          ],
        },
      ];
    } else {
      query.$and = [
        {
          $or: [
            { branch_id: null },
            { visibility: "organization" },
            { visibility: "public" },
            { branch_id: { $exists: true } },
          ],
        },
      ];
    }
  }

  const docs = await Document.find(query).select("_id").lean();
  return docs.map((d) => d._id.toString());
};

const _kbExistsCache = new Map();
const KB_CACHE_TTL = 5 * 60 * 1000;

export const hasApprovedDocuments = async (organizationId) => {
  if (!organizationId) return false;

  const key = organizationId.toString();
  const cached = _kbExistsCache.get(key);
  if (cached && Date.now() - cached.ts < KB_CACHE_TTL) return cached.value;

  const count = await DocumentChunk.countDocuments({
    organization_id: organizationId,
    status: { $in: ["published", "approved", "ready_for_review"] },
  });

  const exists = count > 0;
  _kbExistsCache.set(key, { value: exists, ts: Date.now() });

  // Evict stale entries periodically
  if (_kbExistsCache.size > 200) {
    const now = Date.now();
    for (const [k, v] of _kbExistsCache) {
      if (now - v.ts > KB_CACHE_TTL) _kbExistsCache.delete(k);
    }
  }

  return exists;
};

// ── Cleanup & stats ──────────────────────────────────────────────────

export const deleteDocumentData = async (documentId) => {
  await DocumentChunk.deleteMany({ document_id: documentId });
  
  // Clear GraphRAG relationships and nodes in MongoDB
  try {
    const { clearDocumentGraph } = await import("../../services/mongodbGraph.service.js");
    await clearDocumentGraph(documentId);
  } catch (err) {
    console.error(`[GraphRAG] Failed to clear document graph for ${documentId}:`, err.message);
  }

  // Invalidate KB presence cache — doc count may have changed
  _kbExistsCache.clear();
  return { message: "Document data deleted" };
};

export const getRAGStats = async () => {
  const [chunkCount, docCount] = await Promise.all([
    DocumentChunk.countDocuments(),
    Document.countDocuments(),
  ]);
  return { chunkCount, docCount };
};
