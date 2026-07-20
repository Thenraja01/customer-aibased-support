import ChatAnalytics from "./chatAnalytics.schema.js";

export const getAnalyticsByChatId = async (chatId) => {
  const analytics = await ChatAnalytics.findOne({ chat_id: chatId })
    .populate("chat_id", "topic status")
    .populate("organization_id", "name");
  if (!analytics) throw new Error("Chat analytics not found");
  return analytics;
};

export const getAllAnalytics = async (query = {}) => {
  return await ChatAnalytics.find(query)
    .populate("chat_id", "topic status")
    .populate("organization_id", "name")
    .sort({ created_at: -1 });
};

export const getOrganizationAnalytics = async (organizationId) => {
  return await ChatAnalytics.find({ organization_id: organizationId })
    .populate("chat_id", "topic status")
    .sort({ updated_at: -1 });
};

export const getAnalyticsStats = async (organizationId) => {
  const match = organizationId ? { organization_id: organizationId } : {};
  const stats = await ChatAnalytics.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total_chats: { $sum: 1 },
        avg_messages: { $avg: "$total_messages" },
        avg_response_time: { $avg: "$avg_response_time_ms" },
        avg_resolution_time: { $avg: "$resolution_time_ms" },
        total_escalations: { $sum: "$escalation_count" },
      },
    },
  ]);
  return stats[0] || {};
};

export const deleteAnalytics = async (chatId) => {
  const analytics = await ChatAnalytics.findOneAndDelete({ chat_id: chatId });
  if (!analytics) throw new Error("Chat analytics not found");
  return { message: "Chat analytics deleted" };
};
