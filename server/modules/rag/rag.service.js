import DocumentChunk from "../document/documentChunk.schema.js";
import Document from "../document/document.schema.js";
import DocumentRoleAccess from "../document/documentRoleAccess.schema.js";
import Organization from "../organization/organization.schema.js";
import {
  chunkHashMap,
  keywordIndexMap,
} from "./hashmap.service.js";
import {
  buildFullContext,
  appendToShortTerm,
  getRelevantMemories,
} from "../memory/memory.service.js";
import { getEmbedding, getEmbeddingDim } from "../../services/embedding.service.js";
import { normalizeRoleName, isNormalizedAdminRole } from "../../utils/constants.js";

const FALLBACK_DIM = 256;

const FALLBACK_STOP_WORDS = new Set(["the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for", "of", "and", "or", "but"]);

const fallbackExtractKeywords = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !FALLBACK_STOP_WORDS.has(w));
};

const fallbackHashIndex = (word) => {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = ((hash << 5) - hash) + word.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % FALLBACK_DIM;
};

const fallbackEmbedding = (text) => {
  const keywords = fallbackExtractKeywords(text);
  const embedding = new Array(FALLBACK_DIM).fill(0);
  for (let i = 0; i < keywords.length; i++) {
    const idx = fallbackHashIndex(keywords[i]);
    embedding[idx] += 1;
  }
  const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < FALLBACK_DIM; i++) embedding[i] /= norm;
  }
  return embedding;
};

export const extractKeywords = (text) => {
  return fallbackExtractKeywords(text);
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

export const computeEmbedding = async (text) => {
  try {
    const emb = await getEmbedding(text);
    if (emb) return emb;
  } catch (err) {
    console.error(`[RAG] Ollama embedding failed, using fallback:`, err.message);
  }
  return fallbackEmbedding(text);
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

export const getAuthorizedDocumentIds = async (organizationId, roleId) => {
  if (!organizationId || !roleId) return [];

  const accessEntries = await DocumentRoleAccess.find({
    organization_id: organizationId,
    role_id: roleId,
  }).select("document_id").lean();

  const directDocIds = accessEntries.map((e) => e.document_id);

  const allDocs = await Document.find({
    organization_id: organizationId,
    assigned_role: { $in: ["all", "All"] },
  }).select("_id").lean();

  const allDocIds = allDocs.map((d) => d._id);

  return [...new Set([...directDocIds.map(String), ...allDocIds.map(String)])];
};

export const getRoleFilter = (roleName) => {
  if (!roleName) return null;
  const normalizedRole = normalizeRoleName(roleName);
  if (isNormalizedAdminRole(normalizedRole)) {
    return null;
  }
  return { $in: [normalizedRole, "all"] };
};

export const vectorSearch = async (embedding, organizationId, documentId, limit = 5, roleFilter = null, statusFilter = "approved", authorizedDocIds = null) => {
  const query = { embedding: { $exists: true, $ne: [] } };
  if (organizationId) query.organization_id = organizationId;
  if (documentId) query.document_id = documentId;
  if (roleFilter) query.assigned_role = roleFilter;
  if (statusFilter) query.status = statusFilter;
  if (authorizedDocIds) query.document_id = { $in: authorizedDocIds };
  const chunks = await DocumentChunk.find(query).lean();
  return chunks
    .map((c) => ({ ...c, score: cosineSimilarity(embedding, c.embedding || []) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

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

const scoreKeywordMatch = (keywords, chunkKeywords, content) => {
  let score = 0;
  const lowerContent = (content || "").toLowerCase();
  for (const kw of keywords) {
    const lowerKw = kw.toLowerCase();
    if (chunkKeywords.some(ck => ck.toLowerCase() === lowerKw)) {
      score += 1;
    } else if (chunkKeywords.some(ck => fuzzyMatch(lowerKw, ck.toLowerCase()) > 0.6)) {
      score += 0.6;
    }
    if (lowerContent.includes(lowerKw)) {
      score += 0.3;
    }
  }
  return keywords.length > 0 ? score / keywords.length : 0;
};

export const keywordSearch = async (keywords, organizationId, documentId, roleFilter = null, statusFilter = "approved", authorizedDocIds = null) => {
  if (!keywords || keywords.length === 0) return [];

  const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const query = {
    $or: [
      { keywords: { $in: keywords } },
      { content: { $regex: escaped.join('|'), $options: 'i' } },
    ],
  };
  if (organizationId) query.organization_id = organizationId;
  if (documentId) query.document_id = documentId;
  if (roleFilter) query.assigned_role = roleFilter;
  if (statusFilter) query.status = statusFilter;
  if (authorizedDocIds) query.document_id = { $in: authorizedDocIds };

  const chunks = await DocumentChunk.find(query).lean();
  return chunks
    .map(c => ({
      ...c,
      score: scoreKeywordMatch(keywords, c.keywords || [], c.content),
    }))
    .sort((a, b) => b.score - a.score);
};

export const ingestDocument = async (documentId, organizationId, assignedRole, text, status = "pending") => {
  const normalizedRole = (assignedRole || "all").toLowerCase();
  const chunks = chunkText(text);
  const savedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    const keywords = extractKeywords(chunks[i]);
    const embedding = await computeEmbedding(chunks[i]);
    const doc = await DocumentChunk.create({
      document_id: documentId,
      organization_id: organizationId,
      assigned_role: normalizedRole,
      status: status || "pending",
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

export const getRoleAccessibleDocumentIds = async (organizationId, roleId, roleName) => {
  const normalizedRole = normalizeRoleName(roleName);
  if (isNormalizedAdminRole(normalizedRole)) {
    return null;
  }

  const authorizedDocIds = await getAuthorizedDocumentIds(organizationId, roleId);
  return authorizedDocIds.length > 0 ? authorizedDocIds : [];
};

export const hybridQuery = async (query, organizationId, documentId, limit = 5, userId = null, chatId = null, roleName = null, roleId = null) => {
  if (!organizationId) {
    return {
      document_results: [],
      memory_context: "",
      memory_results: [],
      total: 0,
      authorized: false,
      reason: "no_org",
    };
  }

  const org = await Organization.findById(organizationId).select("status _id").lean();
  if (!org) {
    return {
      document_results: [],
      memory_context: "",
      memory_results: [],
      total: 0,
      authorized: false,
      reason: "org_not_found",
    };
  }
  if (org.status !== "active") {
    return {
      document_results: [],
      memory_context: "",
      memory_results: [],
      total: 0,
      authorized: false,
      reason: "org_inactive",
    };
  }

  const roleFilter = getRoleFilter(roleName);

  let authorizedDocIds = null;
  if (roleName && roleFilter !== null) {
    if (roleId) {
      // Get documents from DocumentRoleAccess table
      const accessDocIds = await getRoleAccessibleDocumentIds(organizationId, roleId, roleName);
      
      // Also get documents with assigned_role matching the role or 'all'
      const normalizedRole = roleName.toLowerCase().trim();
      const assignedRoleDocs = await DocumentChunk.find({
        organization_id: organizationId,
        assigned_role: { $in: [normalizedRole, "all"] },
        status: "approved",
      }).select("document_id").lean();
      
      const assignedRoleDocIds = assignedRoleDocs.map(d => d.document_id.toString());
      
      // Combine both sources
      const combinedDocIds = new Set([
        ...(accessDocIds || []),
        ...assignedRoleDocIds
      ]);
      
      authorizedDocIds = combinedDocIds.size > 0 ? [...combinedDocIds] : null;
      
      if (!authorizedDocIds || authorizedDocIds.length === 0) {
        return {
          document_results: [],
          memory_context: "",
          memory_results: [],
          total: 0,
          authorized: false,
          reason: "role_not_authorized",
        };
      }
    } else {
      const normalizedRole = roleName.toLowerCase().trim();
      const accessibleCount = await DocumentChunk.countDocuments({
        organization_id: organizationId,
        $or: [
          { assigned_role: { $in: [normalizedRole, "all"] } },
          ...(authorizedDocIds ? [{ document_id: { $in: authorizedDocIds } }] : []),
        ],
      });
      if (accessibleCount === 0) {
        return {
          document_results: [],
          memory_context: "",
          memory_results: [],
          total: 0,
          authorized: false,
          reason: "role_not_authorized",
        };
      }
    }
  }

  const keywords = extractKeywords(query);
  const embedding = await computeEmbedding(query);

  const [vectorResults, keywordResults, memoryContext] = await Promise.all([
    vectorSearch(embedding, organizationId, documentId, limit, roleFilter, "approved", authorizedDocIds),
    keywordSearch(keywords, organizationId, documentId, roleFilter, "approved", authorizedDocIds),
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
      existing.score += r.score * 0.4;
    } else {
      scoreMap.set(id, { ...r, score: r.score * 0.4 });
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
    authorized: true,
    reason: null,
  };
};

export const deleteDocumentData = async (documentId) => {
  await DocumentChunk.deleteMany({ document_id: documentId });
  return { message: "Document data deleted" };
};

export const getRAGStats = async () => {
  const [chunkCount, docCount] = await Promise.all([
    DocumentChunk.countDocuments(),
    Document.countDocuments(),
  ]);
  return { chunkCount, docCount };
};
