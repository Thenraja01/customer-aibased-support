import KnowledgeGap from "./knowledgeGap.schema.js";
import DocumentChunk from "../document/documentChunk.schema.js";
import Document from "../document/document.schema.js";

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
}) => {
  const keywords = extractKeywords(query);
  const topic = detectTopic(keywords);

  const existing = await KnowledgeGap.findOne({
    organization_id: organizationId,
    topic,
    status: "unresolved",
  }).sort({ created_at: -1 });

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

  return await KnowledgeGap.create({
    organization_id: organizationId,
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
    KnowledgeGap.countDocuments({ organization_id: organizationId, status: "unresolved" }),
    KnowledgeGap.countDocuments({ organization_id: organizationId, status: "resolved" }),
    KnowledgeGap.countDocuments({ organization_id: organizationId, status: "dismissed" }),
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

  const totalDocs = await Document.countDocuments({ organization_id: organizationId, status: "approved" });
  const totalChunks = await DocumentChunk.countDocuments({ organization_id: organizationId, status: "approved" });

  return {
    summary: {
      totalGaps,
      unresolvedGaps,
      resolvedGaps,
      dismissedGaps,
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

export const updateGapStatus = async (gapId, status, resolutionNote = "", resolvedBy = null) => {
  const update = { status };
  if (status === "resolved" || status === "reviewed") {
    update.resolution_note = resolutionNote;
    update.resolved_by = resolvedBy;
    update.resolved_at = new Date();
  }
  const gap = await KnowledgeGap.findByIdAndUpdate(gapId, update, { new: true });
  if (!gap) throw new Error("Knowledge gap not found");
  return gap;
};

export const dismissGap = async (gapId, resolvedBy = null) => {
  return updateGapStatus(gapId, "dismissed", "", resolvedBy);
};

export const resolveGap = async (gapId, note, resolvedBy) => {
  return updateGapStatus(gapId, "resolved", note, resolvedBy);
};

export const deleteGap = async (gapId) => {
  const gap = await KnowledgeGap.findByIdAndDelete(gapId);
  if (!gap) throw new Error("Knowledge gap not found");
  return { message: "Knowledge gap deleted" };
};

export const getSuggestedTopics = async (organizationId) => {
  const gaps = await KnowledgeGap.find({
    organization_id: organizationId,
    status: "unresolved",
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