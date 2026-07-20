import APIUsage from "./apiUsage.schema.js";

export const logUsage = async (data) => {
  return await APIUsage.create(data);
};

export const getAll = async (query = {}) => {
  const filter = {};
  if (query.organization_id) filter.organization_id = query.organization_id;
  if (query.user_id) filter.user_id = query.user_id;
  if (query.endpoint) filter.endpoint = query.endpoint;
  return await APIUsage.find(filter)
    .populate("organization_id", "name")
    .populate("user_id", "name email")
    .sort({ created_at: -1 })
    .limit(parseInt(query.limit) || 100);
};

export const getStats = async (organizationId) => {
  const match = organizationId ? { organization_id: organizationId } : {};
  const stats = await APIUsage.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$endpoint",
        count: { $sum: 1 },
        avg_response_time: { $avg: "$response_time_ms" },
        method: { $first: "$method" },
      },
    },
    { $sort: { count: -1 } },
  ]);
  return stats;
};

export const getDailyStats = async (organizationId, days = 7) => {
  const match = { created_at: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } };
  if (organizationId) match.organization_id = organizationId;
  const stats = await APIUsage.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
        count: { $sum: 1 },
        avg_response_time: { $avg: "$response_time_ms" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return stats;
};

export const cleanupOldRecords = async () => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await APIUsage.deleteMany({ created_at: { $lt: cutoff } });
  return { message: `${result.deletedCount} old records cleaned` };
};
