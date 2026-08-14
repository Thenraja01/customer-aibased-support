import KnowledgeGap from "./knowledgeGap.schema.js";
import DocumentChunk from "../document/documentChunk.schema.js";
import Document from "../document/document.schema.js";
import * as docService from "../document/document.service.js";
import * as faqService from "../faq/faq.service.js";
import Faq from "../faq/faq.schema.js";
import User from "../user/user.schema.js";
import { broadcastNotification } from "../notification/notification.service.js";
import * as ragService from "../rag/rag.service.js";
import { normalizeRoleName, isNormalizedAdminRole } from "../../utils/constants.js";

const STOP_WORDS = new Set([
  "the","a","an","is","are","was","were","in","on","at","to","for","of",
  "and","or","but","i","my","me","we","you","he","she","it","they","do",
  "does","did","have","has","had","am","be","been","being","this","that",
  "these","those","with","from","by","as","so","no","not","if","can",
  "what","how","when","where","why","which","who","whom","whose",
]);

const extractKeywords = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .slice(0, 10);
};

const detectTopic = (keywords) => {
  const topicMap = {
    billing: ["billing", "payment", "invoice", "charge", "subscription", "plan", "price", "cost", "refund", "credit"],
    account: ["account", "login", "password", "email", "profile", "settings", "register", "signup", "sign"],
    technical: ["error", "bug", "issue", "problem", "crash", "fail", "broken", "install", "setup", "config", "api"],
    shipping: ["shipping", "delivery", "track", "order", "package", "return", "ship", "warehouse"],
    product: ["feature", "product", "service", "tool", "integration", "support", "update", "version"],
    security: ["security", "privacy", "data", "encrypt", "auth", "permission", "access", "hack"],
    onboarding: ["how", "tutorial", "guide", "start", "begin", "learn", "doc", "manual"],
  };

  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  let bestTopic = "general";
  let bestScore = 0;

  for (const [topic, triggers] of Object.entries(topicMap)) {
    const score = lowerKeywords.filter((k) => triggers.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  return bestTopic;
};

export const logFailedQuery = async ({
  organizationId,
  userId,
  chatId,
  query,
  bestScore,
  avgScore,
  matchedChunks,
  branchId = null,
}) => {
  const keywords = extractKeywords(query);
  const topic = detectTopic(keywords);

  const filter = {
    organization_id: organizationId,
    topic,
    status: "open",
  };
  if (branchId) filter.branch_id = branchId;

  const existing = await KnowledgeGap.findOne(filter).sort({ created_at: -1 });

  if (existing) {
    const queryLower = query.toLowerCase().trim();
    const existingLower = existing.query.toLowerCase().trim();
    const similarity = queryLower === existingLower ? 1 :
      queryLower.split(" ").filter((w) => existingLower.includes(w)).length /
      Math.max(queryLower.split(" ").length, existingLower.split(" ").length);

    if (similarity > 0.6) {
      existing.frequency += 1;
      existing.last_seen_at = new Date();
      existing.avg_score = (existing.avg_score + avgScore) / 2;
      if (bestScore > existing.best_score) existing.best_score = bestScore;
      await existing.save();
      return existing;
    }
  }

  const created = await KnowledgeGap.create({
    organization_id: organizationId,
    branch_id: branchId,
    user_id: userId,
    chat_id: chatId,
    query,
    best_score: bestScore,
    avg_score: avgScore,
    matched_chunks: matchedChunks,
    keywords,
    topic,
    frequency: 1,
    last_seen_at: new Date(),
  });

  await notifyNewGap(organizationId, created);

  return created;
};

export const getKnowledgeGaps = async (organizationId, options = {}) => {
  const { page = 1, limit = 20, status, topic, search, sortBy = "created_at", sortOrder = "desc" } = options;

  const query = { organization_id: organizationId };
  if (status) query.status = status;
  if (topic) query.topic = topic;
  if (search) {
    query.$or = [
      { query: { $regex: search, $options: "i" } },
      { topic: { $regex: search, $options: "i" } },
    ];
  }

  const total = await KnowledgeGap.countDocuments(query);
  const gaps = await KnowledgeGap.find(query)
    .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user_id", "name email")
    .populate("resolved_by", "name email")
    .lean();

  return {
    data: gaps,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getGapStats = async (organizationId) => {
  const [
    totalGaps,
    unresolvedGaps,
    resolvedGaps,
    dismissedGaps,
    topicDistribution,
    severityDistribution,
    recentTrend,
    topFrequentGaps,
  ] = await Promise.all([
    KnowledgeGap.countDocuments({ organization_id: organizationId }),
    KnowledgeGap.countDocuments({ organization_id: organizationId, status: "open" }),
    KnowledgeGap.countDocuments({ organization_id: organizationId, status: "resolved" }),
    KnowledgeGap.countDocuments({ organization_id: organizationId, status: "ignored" }),
    KnowledgeGap.aggregate([
      { $match: { organization_id: organizationId } },
      { $group: { _id: "$topic", count: { $sum: 1 }, avgScore: { $avg: "$best_score" } } },
      { $sort: { count: -1 } },
    ]),
    KnowledgeGap.aggregate([
      { $match: { organization_id: organizationId } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ["$best_score", 0.2] }, then: "critical" },
                { case: { $lt: ["$best_score", 0.35] }, then: "low" },
                { case: { $lt: ["$best_score", 0.5] }, then: "medium" },
              ],
              default: "high",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    KnowledgeGap.aggregate([
      { $match: { organization_id: organizationId, created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          count: { $sum: 1 },
          avgScore: { $avg: "$best_score" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    KnowledgeGap.find({ organization_id: organizationId })
      .sort({ frequency: -1 })
      .limit(10)
      .select("query topic frequency best_score status")
      .lean(),
  ]);

  // KB coverage should reflect what RAG actually serves: PUBLISHED docs/chunks.
  const totalDocs = await Document.countDocuments({ organization_id: organizationId, status: "published" });
  const totalChunks = await DocumentChunk.countDocuments({ organization_id: organizationId, status: "published" });

  return {
    summary: {
      totalGaps,
      openGaps: unresolvedGaps,
      resolvedGaps,
      ignoredGaps: dismissedGaps,
      resolutionRate: totalGaps > 0 ? Math.round(((resolvedGaps + dismissedGaps) / totalGaps) * 100) : 100,
      totalDocuments: totalDocs,
      totalChunks,
    },
    topicDistribution: topicDistribution.map((t) => ({
      topic: t._id,
      count: t.count,
      avgScore: Math.round(t.avgScore * 100) / 100,
    })),
    severityDistribution: severityDistribution.map((s) => ({
      severity: s._id,
      count: s.count,
    })),
    recentTrend: recentTrend.map((d) => ({
      date: d._id,
      count: d.count,
      avgScore: Math.round(d.avgScore * 100) / 100,
    })),
    topFrequentGaps,
  };
};

export const updateGapStatus = async (gapId, status, resolutionNote = "", resolvedBy = null, options = {}) => {
  const { resolutionType, resolutionRefId, linkedItemType, linkedItemTitle } = options;
  const update = { status };
  if (status === "resolved" || status === "reviewing") {
    update.resolution_note = resolutionNote;
    update.resolved_by = resolvedBy;
    update.resolved_at = new Date();
  }
  if (status === "resolved") {
    update.resolution_type = resolutionType || "manual";
    update.resolution_ref_id = resolutionRefId || null;
    update.linked_item_type = linkedItemType || null;
    update.linked_item_title = linkedItemTitle || null;
  }
  const gap = await KnowledgeGap.findByIdAndUpdate(gapId, update, { returnDocument: "after" });
  if (!gap) throw new Error("Knowledge gap not found");
  return gap;
};

export const dismissGap = async (gapId, resolvedBy = null) => {
  return updateGapStatus(gapId, "ignored", "", resolvedBy);
};

export const resolveGap = async (gapId, note, resolvedBy, options = {}) => {
  const { resolutionType = "manual", resolutionRefId = null, linkedItemType = null, linkedItemTitle = null } = options;
  return updateGapStatus(gapId, "resolved", note, resolvedBy, {
    resolutionType,
    resolutionRefId,
    linkedItemType,
    linkedItemTitle,
  });
};

export const deleteGap = async (gapId) => {
  const gap = await KnowledgeGap.findByIdAndDelete(gapId);
  if (!gap) throw new Error("Knowledge gap not found");
  return { message: "Knowledge gap deleted" };
};

export const getSuggestedTopics = async (organizationId) => {
  const gaps = await KnowledgeGap.find({
    organization_id: organizationId,
    status: "open",
  }).select("topic frequency best_score").lean();

  const topicMap = {};
  gaps.forEach((g) => {
    if (!topicMap[g.topic]) topicMap[g.topic] = { count: 0, totalFrequency: 0, avgScore: 0 };
    topicMap[g.topic].count += 1;
    topicMap[g.topic].totalFrequency += g.frequency;
    topicMap[g.topic].avgScore += g.best_score;
  });

  return Object.entries(topicMap)
    .map(([topic, data]) => ({
      topic,
      gapCount: data.count,
      totalFrequency: data.totalFrequency,
      avgScore: Math.round((data.avgScore / data.count) * 100) / 100,
      priority: data.totalFrequency * (1 - data.avgScore / 0.5),
    }))
    .sort((a, b) => b.priority - a.priority);
};

export const getGapById = async (gapId) => {
  const gap = await KnowledgeGap.findById(gapId)
    .populate("user_id", "name email")
    .populate("resolved_by", "name email")
    .lean();
  if (!gap) throw new Error("Knowledge gap not found");
  return gap;
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const titleize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "knowledge";

const getUserContext = async (req) => {
  const userRole = req.user?.roleName || req.user?.role || req.user?.role_id?.role_name;
  const isAdmin =
    isNormalizedAdminRole(normalizeRoleName(userRole)) ||
    normalizeRoleName(userRole) === "super_admin";
  return {
    userId: req.user?.userId || req.user?._id,
    orgId: req.user?.organizationId,
    branchId: req.body?.branch_id || req.user?.branchId || req.user?.branch_id || null,
    roleName: userRole,
    isAdmin,
  };
};

export const addKnowledgeFaq = async (gapId, { question, answer, category = "general" }, req) => {
  const { userId, orgId } = await getUserContext(req);
  if (!orgId) throw new Error("Organization context missing");
  const faq = await faqService.createFaq(
    {
      organization_id: orgId,
      question,
      answer,
      category,
    },
    { userId, roleName: req.user?.roleName }
  );
  await resolveGap(gapId, "Added FAQ knowledge", userId, {
    resolutionType: "faq",
    resolutionRefId: faq._id,
    linkedItemType: "faq",
    linkedItemTitle: question,
  });
  return faq;
};

export const addKnowledgeDocument = async (
  gapId,
  { title, description = "", content, branchId = null, tags = [], allowedRoles, visibility },
  req
) => {
  const { userId, orgId, isAdmin } = await getUserContext(req);
  if (!orgId) throw new Error("Organization context missing");
  if (!content || !content.trim()) throw new Error("Content is required");

  const fileBuffer = Buffer.from(content, "utf-8");
  const fileName = `${titleize(title)}.txt`;

  const doc = await docService.createDocument(
    {
      user_id: userId,
      organization_id: orgId,
      branch_id: branchId || null,
      title,
      description,
      allowed_roles: allowedRoles || ["admin", "branch_admin", "support"],
      visibility: visibility || (branchId ? "branch" : "organization"),
    },
    userId,
    fileBuffer,
    fileName,
    "text/plain",
    isAdmin
  );

  await resolveGap(gapId, "Added document knowledge", userId, {
    resolutionType: "document",
    resolutionRefId: doc._id,
    linkedItemType: "document",
    linkedItemTitle: title,
  });

  return doc;
};

export const linkExistingKnowledge = async (gapId, { type, refId }, req) => {
  const { userId, orgId } = await getUserContext(req);
  if (!orgId) throw new Error("Organization context missing");

  let title = "";
  if (type === "document") {
    const doc = await Document.findOne({ _id: refId, organization_id: orgId });
    if (!doc) throw new Error("Document not found");
    title = doc.title;
  } else if (type === "faq") {
    const faq = await Faq.findOne({ _id: refId, organization_id: orgId });
    if (!faq) throw new Error("FAQ not found");
    title = faq.question;
  } else {
    throw new Error("Unsupported linked item type");
  }

  await resolveGap(gapId, `Linked existing ${type}`, userId, {
    resolutionType: type === "document" ? "linked_document" : "linked_faq",
    resolutionRefId: refId,
    linkedItemType: type,
    linkedItemTitle: title,
  });

  return { type, refId, title };
};

export const retestGap = async (gapId, orgId, userId = null) => {
  const gap = await KnowledgeGap.findById(gapId).lean();
  if (!gap) throw new Error("Knowledge gap not found");

  const accessScope = {
    roleName: "admin",
    roleFilter: ragService.getRoleFilter("admin"),
    authorizedDocumentIds: null,
    statusFilter: "published",
  };

  const results = await ragService.searchWithScope(
    gap.query,
    orgId || gap.organization_id,
    accessScope,
    5,
    userId,
    null
  );

  const scores = (results?.document_results || []).map((r) => r.score || 0);
  const bestScore = scores.length ? Math.max(...scores) : 0;
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  return {
    bestScore,
    avgScore,
    matchedChunks: scores.length,
    results: (results?.document_results || []).map((r) => ({
      chunk_id: r._id,
      document_id: r.document_id,
      title: r.title || r.document_title || null,
      score: r.score || 0,
      content: (r.content || r.text || "").slice(0, 300),
    })),
  };
};

export const getGapDetail = async (gapId, orgId) => {
  const gap = await getGapById(gapId);
  if (!orgId || (gap.organization_id?.toString?.() !== orgId.toString())) {
    throw new Error("Knowledge gap not found");
  }

  const similarGaps = await KnowledgeGap.find({
    _id: { $ne: gap._id },
    organization_id: orgId,
    topic: gap.topic,
    status: { $in: ["open", "reviewing"] },
  })
    .select("query topic frequency best_score status created_at")
    .sort({ frequency: -1 })
    .limit(5)
    .lean();

  return { ...gap, similar_gaps: similarGaps };
};

export const getSuggestedKnowledge = async (gapId, orgId) => {
  const gap = await KnowledgeGap.findById(gapId).lean();
  if (!gap) throw new Error("Knowledge gap not found");

  const safe = escapeRegex(gap.query);
  const keywords = (gap.keywords || []).slice(0, 5).map(escapeRegex);

  const titleOr = [{ title: { $regex: safe, $options: "i" } }];
  const kwTitleOr = keywords.map((kw) => ({ title: { $regex: kw, $options: "i" } }));

  const [documents, faqs] = await Promise.all([
    Document.find({
      organization_id: orgId,
      status: "published",
      $or: [...titleOr, ...kwTitleOr],
    })
      .select("title description file_name status created_at")
      .sort({ created_at: -1 })
      .limit(6)
      .lean(),
    Faq.find({
      organization_id: orgId,
      is_active: true,
      status: "approved",
      $or: [
        { question: { $regex: safe, $options: "i" } },
        { answer: { $regex: safe, $options: "i" } },
        ...keywords.map((kw) => ({ question: { $regex: kw, $options: "i" } })),
      ],
    })
      .select("question answer category")
      .sort({ created_at: -1 })
      .limit(6)
      .lean(),
  ]);

  return {
    documents: documents.map((d) => ({ type: "document", ...d })),
    faqs: faqs.map((f) => ({ type: "faq", ...f })),
  };
};

export const getSimilarGaps = async (gapId, orgId, limit = 5) => {
  const gap = await KnowledgeGap.findById(gapId).lean();
  if (!gap) throw new Error("Knowledge gap not found");
  return await KnowledgeGap.find({
    _id: { $ne: gap._id },
    organization_id: orgId,
    $or: [{ topic: gap.topic }, { best_score: { $lte: gap.best_score + 0.05, $gte: Math.max(0, gap.best_score - 0.05) } }],
    status: { $in: ["open", "reviewing"] },
  })
    .select("query topic frequency best_score status created_at")
    .sort({ frequency: -1 })
    .limit(limit)
    .lean();
};

export const notifyNewGap = async (organizationId, gap) => {
  try {
    const admins = await User.find({
      organization_id: organizationId,
      role: { $in: ["admin", "super_admin"] },
      status: "active",
    }).select("_id").lean();
    const userIds = admins.map((u) => u._id);
    if (!userIds.length) return;
    await broadcastNotification(
      {
        organization_id: organizationId,
        title: "New knowledge gap detected",
        message: `"${gap.query.slice(0, 120)}" — ${gap.frequency}×, best match ${Math.round(gap.best_score * 100)}%. Review in Knowledge Gaps.`,
        type: "warning",
        link: "/admin/knowledge-gaps",
      },
      userIds
    );
  } catch (err) {
    console.warn("[KnowledgeGap] Failed to notify admins:", err.message);
  }
};