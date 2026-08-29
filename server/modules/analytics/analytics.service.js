import Chat from "../chat/chat.schema.js";
import Ticket from "../ticket/ticket.schema.js";
import User from "../user/user.schema.js";
import AIUsage from "../ai/schemas/aiUsage.schema.js";
import AIFeedback from "../ai/schemas/aiFeedback.schema.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const fillSeries = (buckets, days) => {
  const map = new Map(buckets.map((b) => [String(b._id), b]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS);
    const key = d.toISOString().slice(0, 10);
    const bucket = map.get(key);
    series.push({
      date: key,
      calls: bucket?.calls || 0,
      tokens: bucket?.tokens || 0,
      cost: bucket?.cost || 0,
      chats: bucket?.chats || 0,
      tickets: bucket?.tickets || 0,
    });
  }
  return series;
};

const lastNDays = (days) => new Date(Date.now() - (days - 1) * DAY_MS);

export const getAnalyticsOverview = async (orgId, { days = 30 } = {}) => {
  const since = lastNDays(days);
  const orgMatch = { organization_id: orgId };

  const [chatStats, ticketStats, userCount, aiSummary, feedback, byDay, aiByProvider, aiByModel] = await Promise.all([
    Chat.aggregate([
      { $match: orgMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Ticket.aggregate([
      { $match: orgMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    User.countDocuments({ organization_id: orgId, status: "active" }),
    AIUsage.aggregate([
      { $match: { ...orgMatch, created_at: { $gte: since } } },
      {
        $group: {
          _id: null,
          calls: { $sum: 1 },
          tokens: { $sum: "$total_tokens" },
          cost: { $sum: "$cost_usd" },
          avg_latency: { $avg: "$latency_ms" },
          successes: { $sum: { $cond: ["$success", 1, 0] } },
        },
      },
    ]),
    AIFeedback.aggregate([
      { $match: { organization_id: orgId, created_at: { $gte: since } } },
      { $group: { _id: "$helpful", count: { $sum: 1 } } },
    ]),
    (async () => {
      const [chatSeries, aiSeries, ticketSeries] = await Promise.all([
        Chat.aggregate([
          { $match: { ...orgMatch, created_at: { $gte: since } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, chats: { $sum: 1 } } },
        ]),
        AIUsage.aggregate([
          { $match: { ...orgMatch, created_at: { $gte: since } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
              calls: { $sum: 1 },
              tokens: { $sum: "$total_tokens" },
              cost: { $sum: "$cost_usd" },
            },
          },
        ]),
        Ticket.aggregate([
          { $match: { ...orgMatch, created_at: { $gte: since } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, tickets: { $sum: 1 } } },
        ]),
      ]);
      const merged = new Map();
      [...chatSeries, ...aiSeries, ...ticketSeries].forEach((b) => {
        const key = String(b._id);
        const cur = merged.get(key) || { _id: key, chats: 0, calls: 0, tokens: 0, cost: 0, tickets: 0 };
        merged.set(key, { ...cur, ...b });
      });
      return fillSeries([...merged.values()], days);
    })(),
    AIUsage.aggregate([
      { $match: { ...orgMatch, created_at: { $gte: since } } },
      { $group: { _id: "$provider", calls: { $sum: 1 }, tokens: { $sum: "$total_tokens" }, cost: { $sum: "$cost_usd" } } },
      { $sort: { calls: -1 } },
    ]),
    AIUsage.aggregate([
      { $match: { ...orgMatch, created_at: { $gte: since } } },
      { $group: { _id: "$model", calls: { $sum: 1 }, tokens: { $sum: "$total_tokens" }, cost: { $sum: "$cost_usd" }, avg_latency: { $avg: "$latency_ms" } } },
      { $sort: { calls: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const toCounts = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));

  const chatCounts = toCounts(chatStats);
  const ticketCounts = toCounts(ticketStats);
  const aiTotals = aiSummary[0] || { calls: 0, tokens: 0, cost: 0, avg_latency: 0, successes: 0 };
  const feedbackCounts = toCounts(feedback);

  return {
    period_days: days,
    chats: {
      total: Object.values(chatCounts).reduce((a, b) => a + b, 0),
      open: chatCounts.open || 0,
      closed: chatCounts.closed || 0,
    },
    tickets: {
      total: Object.values(ticketCounts).reduce((a, b) => a + b, 0),
      open: (ticketCounts.open || 0) + (ticketCounts.assigned || 0) + (ticketCounts.in_progress || 0) + (ticketCounts.waiting_for_customer || 0),
      resolved: (ticketCounts.resolved || 0) + (ticketCounts.closed || 0),
      by_status: ticketCounts,
    },
    users: { active: userCount },
    ai: {
      calls: aiTotals.calls,
      tokens: aiTotals.tokens,
      cost_usd: aiTotals.cost,
      avg_latency_ms: aiTotals.avg_latency,
      success_rate: aiTotals.calls ? Math.round((aiTotals.successes / aiTotals.calls) * 100) : 0,
      feedback: { helpful: feedbackCounts.true || 0, unhelpful: feedbackCounts.false || 0 },
      by_provider: aiByProvider,
      by_model: aiByModel,
    },
    series: byDay,
  };
};

/**
 * Deep AI usage analytics — model/provider/feature breakdowns over a window.
 */
export const getAIUsageAnalytics = async (orgId, { days = 30, from, to } = {}) => {
  const match = { organization_id: orgId };
  const start = from ? new Date(from) : lastNDays(days);
  const end = to ? new Date(to) : new Date();
  match.created_at = { $gte: start, $lte: end };

  const [totals, byDay, byModel, byProvider, byFeature, byUser, successBreakdown] = await Promise.all([
    AIUsage.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          calls: { $sum: 1 },
          tokens: { $sum: "$total_tokens" },
          input_tokens: { $sum: "$input_tokens" },
          output_tokens: { $sum: "$output_tokens" },
          cost: { $sum: "$cost_usd" },
          avg_latency: { $avg: "$latency_ms" },
          p95_latency: { $avg: "$latency_ms" },
          successes: { $sum: { $cond: ["$success", 1, 0] } },
        },
      },
    ]),
    AIUsage.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          calls: { $sum: 1 },
          tokens: { $sum: "$total_tokens" },
          cost: { $sum: "$cost_usd" },
          avg_latency: { $avg: "$latency_ms" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    AIUsage.aggregate([
      { $match: match },
      { $group: { _id: "$model", calls: { $sum: 1 }, tokens: { $sum: "$total_tokens" }, cost: { $sum: "$cost_usd" }, avg_latency: { $avg: "$latency_ms" } } },
      { $sort: { calls: -1 } },
    ]),
    AIUsage.aggregate([
      { $match: match },
      { $group: { _id: "$provider", calls: { $sum: 1 }, tokens: { $sum: "$total_tokens" }, cost: { $sum: "$cost_usd" } } },
      { $sort: { calls: -1 } },
    ]),
    AIUsage.aggregate([
      { $match: match },
      { $group: { _id: "$feature", calls: { $sum: 1 }, tokens: { $sum: "$total_tokens" } } },
      { $sort: { calls: -1 } },
    ]),
    AIUsage.aggregate([
      { $match: match },
      { $group: { _id: "$user_id", calls: { $sum: 1 }, tokens: { $sum: "$total_tokens" }, cost: { $sum: "$cost_usd" } } },
      { $sort: { calls: -1 } },
      { $limit: 10 },
    ]),
    AIUsage.aggregate([
      { $match: match },
      { $group: { _id: "$success", count: { $sum: 1 } } },
    ]),
  ]);

  const totalsRow = totals[0] || { calls: 0, tokens: 0, input_tokens: 0, output_tokens: 0, cost: 0, avg_latency: 0, p95_latency: 0, successes: 0 };
  const successMap = Object.fromEntries(successBreakdown.map((s) => [String(s._id), s.count]));

  return {
    window: { from: start, to: end },
    totals: {
      calls: totalsRow.calls,
      tokens: totalsRow.tokens,
      input_tokens: totalsRow.input_tokens,
      output_tokens: totalsRow.output_tokens,
      cost_usd: totalsRow.cost,
      avg_latency_ms: totalsRow.avg_latency,
      success_rate: totalsRow.calls ? Math.round((totalsRow.successes / totalsRow.calls) * 100) : 0,
      succeeded: successMap.true || 0,
      failed: successMap.false || 0,
    },
    by_day: byDay,
    by_model: byModel,
    by_provider: byProvider,
    by_feature: byFeature,
    top_users: byUser,
  };
};

export default {
  getAnalyticsOverview,
  getAIUsageAnalytics,
};