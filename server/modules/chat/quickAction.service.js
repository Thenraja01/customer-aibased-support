import Document from "../document/document.schema.js";
import DocumentChunk from "../document/documentChunk.schema.js";
import Faq from "../faq/faq.schema.js";
import Topic from "../topic/topic.schema.js";
import GraphNode from "../graph/graphNode.schema.js";
import GraphRelationship from "../graph/graphRelationship.schema.js";
import Chat from "./chat.schema.js";
import { getCache } from "../../config/redis.js";
import { getAuthorizedDocumentIds } from "../rag/rag.service.js";
import { normalizeRoleName } from "../../utils/constants.js";

// Helper to format a clean user-facing label
export function formatActionLabel(name) {
  if (!name || typeof name !== "string") return "";
  let clean = name.trim().replace(/[_\-]+/g, " ");
  return clean
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// Generate dynamic natural query from real topic/entity name and description
export function generateQueryFromEntity(name, description = "") {
  const cleanName = formatActionLabel(name);
  const lower = cleanName.toLowerCase();

  if (/policy|guideline|terms/i.test(lower)) {
    return `What is the official ${cleanName}?`;
  }
  if (/how to|setup|install|configure/i.test(lower)) {
    return `How do I ${cleanName}?`;
  }
  if (/error|issue|troubleshoot|bug/i.test(lower)) {
    return `How do I troubleshoot ${cleanName}?`;
  }
  if (/pricing|cost|plan|bill|invoice/i.test(lower)) {
    return `What are the details regarding ${cleanName}?`;
  }
  if (/return|refund|exchange/i.test(lower)) {
    return `How do I request a ${cleanName}?`;
  }
  if (/shipping|delivery|track/i.test(lower)) {
    return `What is the status or policy for ${cleanName}?`;
  }

  if (description && description.trim().length > 5) {
    return `Can you explain ${cleanName}: ${description.trim().replace(/\.$/, "")}?`;
  }

  return `Tell me about ${cleanName}`;
}

// Map dynamic name to appropriate visual icon
export function getIconForEntity(name) {
  const lower = (name || "").toLowerCase();
  if (/refund|return|money|exchange/i.test(lower)) return "refund";
  if (/bill|invoice|payment|pricing|plan/i.test(lower)) return "billing";
  if (/account|profile|user|auth|login|password/i.test(lower)) return "account";
  if (/ship|delivery|track|courier/i.test(lower)) return "shipping";
  if (/order|purchase|cart/i.test(lower)) return "orders";
  if (/warranty|guarantee|claim/i.test(lower)) return "warranty";
  if (/security|privacy|2fa|protect/i.test(lower)) return "security";
  if (/error|troubleshoot|bug|fix/i.test(lower)) return "troubleshoot";
  return "support";
}

/**
 * Dynamic Service: Generates personalized, tenant-aware quick actions
 * driven entirely by real Document Topics and Knowledge Graph entities.
 */
export const getQuickActions = async (user) => {
  if (!user) return [];

  const orgId = user.organization_id?._id || user.organization_id || user.organizationId;
  const branchId = user.branch_id?._id || user.branch_id || user.branchId || null;
  const roleName = user.roleName || user.role || user.role_id?.role_name || "customer";
  const normalizedRole = normalizeRoleName(roleName);

  if (!orgId) return [];

  const cacheKey = `quick-actions:${orgId}:${branchId || "global"}:${normalizedRole}`;
  const cache = getCache();

  // 1. Check Redis cache
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error("[QuickActionService] Cache read error:", err.message);
  }

  // 2. Fetch authorized published document IDs for this user/tenant
  const authDocIds = await getAuthorizedDocumentIds(orgId, roleName, branchId);

  const candidatesMap = new Map(); // Key: normalized name -> Candidate Object

  const recordCandidate = (name, description, boostObj) => {
    const formatted = formatActionLabel(name);
    if (!formatted || formatted.length < 3) return;

    const key = formatted.toLowerCase();
    if (!candidatesMap.has(key)) {
      candidatesMap.set(key, {
        id: key.replace(/\s+/g, "_"),
        label: formatted,
        description: description || `Information and help regarding ${formatted}`,
        query: generateQueryFromEntity(formatted, description),
        icon: getIconForEntity(formatted),
        score: 0,
      });
    }

    const item = candidatesMap.get(key);
    item.score += (boostObj.topicScore || 0) +
                  (boostObj.graphScore || 0) +
                  (boostObj.faqScore || 0) +
                  (boostObj.docScore || 0);
  };

  // ── Source 1: Real Frontend Configured Topics ──
  const topicFilter = { organization_id: orgId, enabled: true };
  if (branchId) {
    topicFilter.$or = [{ branch_id: branchId }, { branch_id: null }];
  }
  const realTopics = await Topic.find(topicFilter).lean();
  for (const t of realTopics) {
    recordCandidate(t.name, t.description, { topicScore: 20 });
  }

  // ── Source 2: Multi-User Crowd Popularity Aggregation (Most Used Cases) ──
  try {
    const chatStats = await Chat.aggregate([
      { $match: { organization_id: orgId } },
      {
        $group: {
          _id: { $toLower: "$topic" },
          uniqueUsers: { $addToSet: "$user_id" },
          totalChats: { $sum: 1 },
        },
      },
      {
        $project: {
          topic: "$_id",
          userCount: { $size: "$uniqueUsers" },
          totalChats: 1,
        },
      },
      { $sort: { userCount: -1, totalChats: -1 } },
      { $limit: 20 },
    ]);

    for (const stat of chatStats) {
      if (stat.topic && stat.topic !== "general") {
        // Boost existing candidate or register popular chat topic
        recordCandidate(stat.topic, "", {
          topicScore: (stat.userCount * 15) + (stat.totalChats * 4),
        });
      }
    }
  } catch (aggErr) {
    console.warn("[QuickActionService] Chat crowd analytics aggregation warning:", aggErr.message);
  }

  // ── Source 3: Real Knowledge Graph Entities & Relations ──
  if (authDocIds.length > 0) {
    const graphRelationships = await GraphRelationship.find({
      organization_id: orgId,
      $or: [
        { document_id: { $in: authDocIds } },
        { type: { $in: ["HAS_ENTITY", "RELATED_TO", "HAS_TOPIC"] } }
      ]
    }).limit(40).lean();

    const entityFreq = {};
    for (const rel of graphRelationships) {
      if (rel.target_name) {
        entityFreq[rel.target_name] = (entityFreq[rel.target_name] || 0) + (rel.confidence_score || 1);
      }
      if (rel.source_name) {
        entityFreq[rel.source_name] = (entityFreq[rel.source_name] || 0) + (rel.confidence_score || 1);
      }
    }

    for (const [entityName, freq] of Object.entries(entityFreq)) {
      recordCandidate(entityName, "", { graphScore: Math.round(freq * 3) });
    }

    // Direct GraphNode concepts
    const graphNodes = await GraphNode.find({
      organization_id: orgId,
      type: { $in: ["topic", "policy", "service", "product", "resolution"] },
    }).limit(15).lean();

    for (const gn of graphNodes) {
      recordCandidate(gn.name, gn.properties?.description || "", { graphScore: 8 });
    }
  }

  // ── Source 4: Real FAQ Categories ──
  const approvedFaqs = await Faq.find({
    organization_id: orgId,
    status: "approved",
    is_active: true,
  }).limit(20).lean();

  for (const faq of approvedFaqs) {
    if (faq.category) {
      recordCandidate(faq.category, "", { faqScore: 6 });
    }
  }

  // ── Source 5: Real Document Titles ──
  if (authDocIds.length > 0) {
    const publishedDocs = await Document.find({
      _id: { $in: authDocIds },
      status: "published",
    }).select("title description document_type_id").populate("document_type_id").limit(15).lean();

    for (const doc of publishedDocs) {
      if (doc.document_type_id?.name) {
        recordCandidate(doc.document_type_id.name, "", { docScore: 5 });
      }
      if (doc.title) {
        const cleanTitle = doc.title.replace(/\.[a-zA-Z0-9]+$/, "").trim();
        if (cleanTitle.length <= 40) {
          recordCandidate(cleanTitle, doc.description || "", { docScore: 4 });
        }
      }
    }
  }

  // ── 6. Select Top 4 Most Popular User Use Cases ──
  const candidateList = Array.from(candidatesMap.values());

  // Sort strictly by crowd popularity / total score descending
  candidateList.sort((a, b) => b.score - a.score);

  // Take the Best 4
  const topActions = candidateList.slice(0, 4);

  // 7. Cache result in Redis (10-minute TTL)
  try {
    await cache.set(cacheKey, JSON.stringify(topActions), 600);
  } catch (err) {
    console.error("[QuickActionService] Cache write error:", err.message);
  }

  return topActions;
};

/**
 * Invalidate Redis cache whenever Topics, Documents, or FAQs are updated
 */
export const invalidateQuickActionCache = async (organizationId) => {
  if (!organizationId) return;
  const cache = getCache();
  const pattern = `quick-actions:${organizationId}:*`;
  try {
    const keys = await cache.keys(pattern);
    if (keys && keys.length > 0) {
      await Promise.all(keys.map((k) => cache.del(k)));
      console.log(`[QuickActionService] Invalidated ${keys.length} cache keys for org: ${organizationId}`);
    }
  } catch (err) {
    console.error("[QuickActionService] Cache invalidation failed:", err.message);
  }
};
