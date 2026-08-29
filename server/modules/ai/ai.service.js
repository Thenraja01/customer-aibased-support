import ConversationSummary from "./schemas/conversationSummary.schema.js";
import AIFeedback from "./schemas/aiFeedback.schema.js";
import AIUsage from "./schemas/aiUsage.schema.js";
import BackgroundJob from "./schemas/backgroundJob.schema.js";

// ── ConversationSummary ─────────────────────────────────────────────

export const createConversationSummary = async (data) => {
  const existing = await ConversationSummary.findOne({ chat_id: data.chat_id });
  if (existing) {
    Object.assign(existing, data);
    return existing.save();
  }
  return ConversationSummary.create(data);
};

export const getConversationSummary = async (chatId) => {
  return ConversationSummary.findOne({ chat_id: chatId }).lean();
};

export const getAllConversationSummaries = async (orgId, opts = {}) => {
  const { resolved, limit = 50, skip = 0 } = opts;
  const query = { organization_id: orgId };
  if (resolved !== undefined) query.resolved = resolved;
  return ConversationSummary.find(query)
    .sort({ generated_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// ── AIFeedback ──────────────────────────────────────────────────────

export const createAIFeedback = async (data) => {
  return AIFeedback.create({
    ...data,
    organization_id: data.organization_id,
  });
};

export const getAIFeedbackStats = async (orgId) => {
  const [total, helpful, unhelpful, byRating] = await Promise.all([
    AIFeedback.countDocuments({ organization_id: orgId }),
    AIFeedback.countDocuments({ organization_id: orgId, helpful: true }),
    AIFeedback.countDocuments({ organization_id: orgId, helpful: false }),
    AIFeedback.aggregate([
      { $match: { organization_id: orgId, rating: { $ne: null } } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return { total, helpful, unhelpful, byRating };
};

export const getFeedbackByChat = async (orgId, chatId) => {
  return AIFeedback.find({ organization_id: orgId, chat_id: chatId })
    .sort({ created_at: -1 })
    .lean();
};

// ── AIUsage ─────────────────────────────────────────────────────────

export const recordAIUsage = async (data) => {
  const { input_tokens, output_tokens } = data;
  const entry = {
    ...data,
    total_tokens: input_tokens + output_tokens,
  };
  return AIUsage.create(entry);
};

export const getAIUsageReport = async (orgId, opts = {}) => {
  const { startDate, endDate, model, limit = 100 } = opts;
  const match = { organization_id: orgId };
  if (startDate || endDate) {
    match.created_at = {};
    if (startDate) match.created_at.$gte = new Date(startDate);
    if (endDate) match.created_at.$lte = new Date(endDate);
  }
  if (model) match.model = model;

  const [totalTokens, totalCost, byModel, recent] = await Promise.all([
    AIUsage.aggregate([
      { $match: match },
      { $group: { _id: null, tokens: { $sum: "$total_tokens" }, cost: { $sum: "$cost_usd" } } },
    ]),
    AIUsage.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$model",
          tokens: { $sum: "$total_tokens" },
          cost: { $sum: "$cost_usd" },
          calls: { $sum: 1 },
          avg_latency: { $avg: "$latency_ms" },
        },
      },
      { $sort: { tokens: -1 } },
    ]),
    AIUsage.find(match).sort({ created_at: -1 }).limit(limit).lean(),
  ]);

  return {
    summary: totalTokens[0] || { tokens: 0, cost: 0 },
    byModel,
    recent,
  };
};

// ── BackgroundJob ───────────────────────────────────────────────────

export const enqueueJob = async (data) => {
  return BackgroundJob.create({
    ...data,
    status: "queued",
    retry_count: 0,
    scheduled_at: new Date(),
  });
};

export const getQueuedJobs = async (limit = 50) => {
  return BackgroundJob.find({ status: "queued", scheduled_at: { $lte: new Date() } })
    .sort({ priority: -1, scheduled_at: 1 })
    .limit(limit)
    .lean();
};

export const claimJob = async (jobId, workerId) => {
  return BackgroundJob.findOneAndUpdate(
    { _id: jobId, status: "queued" },
    { status: "processing", started_at: new Date() },
    { new: true }
  );
};

/**
 * Re-queue jobs left in "processing" by a crashed/restarted worker. Prevents
 * documents from staying stuck in "processing" forever with no active worker.
 */
export const requeueStaleJobs = async (maxAgeMs = 5 * 60 * 1000) => {
  const cutoff = new Date(Date.now() - maxAgeMs);
  return BackgroundJob.updateMany(
    {
      status: "processing",
      $or: [{ started_at: { $lte: cutoff } }, { started_at: null }],
    },
    { $set: { status: "queued", scheduled_at: new Date(), error_message: null }, $inc: { retry_count: 1 } }
  );
};

export const completeJob = async (jobId, result = {}) => {
  return BackgroundJob.findByIdAndUpdate(
    jobId,
    { status: "completed", finished_at: new Date(), result },
    { new: true }
  );
};

export const failJob = async (jobId, errorMessage, retry = true) => {
  const job = await BackgroundJob.findById(jobId);
  if (!job) throw new Error("BackgroundJob not found");

  if (retry && job.retry_count < job.max_retries) {
    return BackgroundJob.findByIdAndUpdate(
      jobId,
      { status: "queued", retry_count: job.retry_count + 1, error_message: errorMessage, scheduled_at: new Date() },
      { new: true }
    );
  }

  return BackgroundJob.findByIdAndUpdate(
    jobId,
    { status: "failed", error_message: errorMessage, finished_at: new Date() },
    { new: true }
  );
};

export const getJobStats = async (orgId) => {
  const match = orgId ? { organization_id: orgId } : {};
  return BackgroundJob.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

export default {
  createConversationSummary,
  getConversationSummary,
  getAllConversationSummaries,
  createAIFeedback,
  getAIFeedbackStats,
  getFeedbackByChat,
  recordAIUsage,
  getAIUsageReport,
  enqueueJob,
  getQueuedJobs,
  claimJob,
  completeJob,
  failJob,
  requeueStaleJobs,
  getJobStats,
};
