import Document from "../document/document.schema.js";
import DocumentChunk from "../document/documentChunk.schema.js";
import Faq from "../faq/faq.schema.js";
import DocumentType from "../document-type/documentType.schema.js";
import Chat from "./chat.schema.js";
import GraphEntity from "./graphEntity.schema.js";
import { getCache } from "../../config/redis.js";
import { getAuthorizedDocumentIds } from "../rag/rag.service.js";
import { normalizeRoleName, isNormalizedAdminRole } from "../../utils/constants.js";
import { generateResponse } from "../llm/index.js";

// Helper to normalize category/topic names to standard labels
export function normalizeCategoryName(name) {
  if (!name) return "";
  let clean = name.trim();
  clean = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();

  // Standard mappings for quick-action alignment
  if (/refund|return/i.test(clean)) return "Refunds";
  if (/billing|payment|invoice/i.test(clean)) return "Billing";
  if (/account|profile|login/i.test(clean)) return "Account";
  if (/support|technical|help|troubleshoot/i.test(clean)) return "Support";
  if (/shipping|delivery|tracking/i.test(clean)) return "Shipping";
  if (/password|credential/i.test(clean)) return "Password";
  if (/order|purchase/i.test(clean)) return "Orders";
  if (/warranty|guarantee/i.test(clean)) return "Warranty";
  
  return clean;
}

// Map a normalized label to a predefined user query template
export function getQueryForLabel(label) {
  const queryMap = {
    "Refunds": "How do I request a refund?",
    "Billing": "I have a question about my billing",
    "Account": "I need help with my account",
    "Support": "I need technical support",
    "Shipping": "Where is my order shipping status?",
    "Password": "How do I reset my password?",
    "Orders": "How do I track my orders?",
    "Warranty": "What is the warranty policy?",
  };
  return queryMap[label] || `I need help with ${label.toLowerCase()}`;
}

// Map a normalized label to a predefined icon key
export function getIconForLabel(label) {
  const iconMap = {
    "Refunds": "refund",
    "Billing": "billing",
    "Account": "account",
    "Support": "support",
    "Shipping": "shipping",
    "Password": "password",
    "Orders": "orders",
    "Warranty": "warranty",
  };
  return iconMap[label] || "support";
}

// Get the role specific expectations to apply scoring boost
export function getRoleKeywords(role) {
  const normalized = normalizeRoleName(role);
  if (normalized === "customer") {
    return ["Refunds", "Billing", "Orders", "Account"];
  }
  if (normalized === "support") {
    return ["Refunds", "Billing", "Support", "Account"];
  }
  if (normalized === "branch_admin") {
    return ["Billing", "Support", "Orders", "Account"];
  }
  if (isNormalizedAdminRole(normalized) || normalized === "super_admin") {
    return ["Billing", "Support", "Account"];
  }
  return [];
}

/**
 * Main Service for generating personalized, tenant-aware quick actions
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

  // 1. Try cache hit
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error("[QuickActionService] Cache read error:", err.message);
  }

  // 2. Fetch authorized published document IDs
  const authDocIds = await getAuthorizedDocumentIds(orgId, roleName, branchId);

  // 3. Collect candidates across layers
  const candidates = {}; // Key: normalizedLabel, Value: { label, topicFreq, faqFreq, graphFreq, branchDocCount }

  const registerCandidate = (rawName, scoreObj) => {
    const label = normalizeCategoryName(rawName);
    if (!label) return;
    if (!candidates[label]) {
      candidates[label] = {
        label,
        topicFreq: 0,
        faqFreq: 0,
        graphFreq: 0,
        branchDocCount: 0,
      };
    }
    const cand = candidates[label];
    if (scoreObj.topicFreq) cand.topicFreq += scoreObj.topicFreq;
    if (scoreObj.faqFreq) cand.faqFreq += scoreObj.faqFreq;
    if (scoreObj.graphFreq) cand.graphFreq += scoreObj.graphFreq;
    if (scoreObj.branchDocCount) cand.branchDocCount += scoreObj.branchDocCount;
  };

  // Layer 1: FAQ Categories
  const faqs = await Faq.find({
    organization_id: orgId,
    status: "approved",
    is_active: true,
  }).lean();
  for (const faq of faqs) {
    if (faq.category) {
      registerCandidate(faq.category, { faqFreq: 1 });
    }
  }

  // Fetch authorized documents for Types and Metadata
  const documents = await Document.find({ _id: { $in: authDocIds }, status: "published" })
    .populate("document_type_id")
    .lean();

  // Layer 2: Document Types
  for (const doc of documents) {
    const isBranchSpecific = doc.branch_id && branchId && doc.branch_id.toString() === branchId.toString();
    if (doc.document_type_id && doc.document_type_id.name) {
      registerCandidate(doc.document_type_id.name, {
        topicFreq: 1,
        branchDocCount: isBranchSpecific ? 1 : 0
      });
    }
  }

  // Layer 3: Document Metadata / Titles
  for (const doc of documents) {
    const isBranchSpecific = doc.branch_id && branchId && doc.branch_id.toString() === branchId.toString();
    // Parse words from title as potential candidates
    const titleWords = doc.title.split(/[^a-zA-Z]+/);
    for (const word of titleWords) {
      if (word.length > 4) {
        registerCandidate(word, {
          topicFreq: 1,
          branchDocCount: isBranchSpecific ? 1 : 0
        });
      }
    }
  }

  // Layer 4: Knowledge Graph entities
  const graphEntities = await GraphEntity.find({
    document_id: { $in: authDocIds },
    organization_id: orgId,
  }).lean();
  for (const ge of graphEntities) {
    registerCandidate(ge.entity_name, { graphFreq: 1 });
  }

  // Layer 5: Ollama Topic Generation (fallback or enrichment if sparse)
  if (Object.keys(candidates).length < 4 && documents.length > 0) {
    try {
      const docExcerpts = documents.map((d) => ({
        title: d.title,
        description: d.description || "",
        type: d.document_type_id?.name || "",
      })).slice(0, 8);

      const systemPrompt = `You are generating quick-action topics for a support chatbot.
Based only on the supplied authorized document metadata, generate the most useful support categories a user may want to ask about.

Supplied Document Metadata:
${JSON.stringify(docExcerpts, null, 2)}

Return JSON only:
{
  "categories": [
    {
      "label": "Refunds",
      "description": "Refund and return questions",
      "confidence": 0.95
    }
  ]
}

Rules:
- maximum 8 categories
- use short user-friendly labels (1-2 words, e.g. "Refunds", "Billing", "Account", "Shipping")
- do not invent categories unsupported by the supplied data
- merge duplicate/similar topics
- do not include internal/system terminology
- do not include authorization information
- do not include document IDs
- do not include private information`;

      const llmRes = await generateResponse(systemPrompt, null, { provider: "ollama", temperature: 0.1 });
      const cleanText = llmRes.text.trim();
      const startIdx = cleanText.indexOf("{");
      const endIdx = cleanText.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1) {
        const parsed = JSON.parse(cleanText.slice(startIdx, endIdx + 1));
        if (parsed.categories && Array.isArray(parsed.categories)) {
          for (const item of parsed.categories) {
            registerCandidate(item.label, { topicFreq: 2 });
          }
        }
      }
    } catch (llmErr) {
      console.warn("[QuickActionService] Ollama category extraction failed:", llmErr.message);
    }
  }

  // 4. Score and rank candidates
  const scored = [];
  const roleKeywords = getRoleKeywords(roleName);

  for (const key of Object.keys(candidates)) {
    const cand = candidates[key];
    const catName = cand.label;

    // recentUsage boost: check active chats with this topic/label
    let recentUsageBoost = 0;
    try {
      const chatCount = await Chat.countDocuments({
        organization_id: orgId,
        topic: { $regex: new RegExp(catName, "i") },
      });
      recentUsageBoost = chatCount * 2;
    } catch {
      /* ignore */
    }

    // roleRelevance boost
    const isRoleRelevant = roleKeywords.includes(catName);
    const roleRelevanceBoost = isRoleRelevant ? 10 : 0;

    // branchRelevance boost
    const branchRelevanceBoost = cand.branchDocCount * 5;

    const totalScore =
      cand.topicFreq +
      cand.faqFreq +
      cand.graphFreq +
      recentUsageBoost +
      roleRelevanceBoost +
      branchRelevanceBoost;

    scored.push({
      id: catName.toLowerCase(),
      label: catName,
      description: `Questions about ${catName.toLowerCase()}`,
      query: getQueryForLabel(catName),
      icon: getIconForLabel(catName),
      score: totalScore,
    });
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Return top 4
  const topActions = scored.slice(0, 4);

  // 5. Cache the results
  try {
    await cache.set(cacheKey, JSON.stringify(topActions));
  } catch (err) {
    console.error("[QuickActionService] Cache write error:", err.message);
  }

  return topActions;
};

/**
 * Cache Invalidation Method
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

/**
 * Seeder to populate GraphEntity table for telemetry and Priorities testing
 */
export const seedGraphEntities = async () => {
  try {
    const count = await GraphEntity.countDocuments();
    if (count > 0) return;

    console.log("[QuickActionService] GraphEntity collection is empty. Seeding concept nodes...");
    const docs = await Document.find({ status: "published" }).lean();
    if (docs.length === 0) {
      console.log("[QuickActionService] No published documents found to seed graph from.");
      return;
    }

    const seedConcepts = ["Refund", "Billing", "Account", "Support", "Shipping", "Warranty", "Orders"];
    const entitiesToInsert = [];

    for (const doc of docs) {
      // Pick 2-3 random concepts that match or fit general domains
      const countToSeed = Math.min(3, seedConcepts.length);
      const shuffled = [...seedConcepts].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < countToSeed; i++) {
        entitiesToInsert.push({
          entity_name: shuffled[i],
          document_id: doc._id,
          organization_id: doc.organization_id,
          branch_id: doc.branch_id || null,
        });
      }
    }

    if (entitiesToInsert.length > 0) {
      await GraphEntity.insertMany(entitiesToInsert);
      console.log(`[QuickActionService] Seeded ${entitiesToInsert.length} graph entity link records.`);
    }
  } catch (err) {
    console.error("[QuickActionService] Seeding GraphEntity failed:", err.message);
  }
};
