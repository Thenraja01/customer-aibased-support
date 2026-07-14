import AISession from "../schema/AISession.schema.js";

// Log an AI interaction for a chat
export const createAISession = async ({
  chat_id,
  model_name,
  tokens_used,
  response_time,
}) => {
  return await AISession.create({ chat_id, model_name, tokens_used, response_time });
};

// Get all AI sessions for a chat
export const getSessionsByChat = async (chatId) => {
  return await AISession.find({ chat_id: chatId })
    .populate("chat_id", "topic status")
    .sort({ created_at: -1 });
};

// Get a session by ID
export const getSessionById = async (sessionId) => {
  const session = await AISession.findById(sessionId).populate(
    "chat_id",
    "topic status"
  );
  if (!session) throw new Error("AI session not found");
  return session;
};

// Get all sessions (admin analytics)
export const getAllSessions = async () => {
  return await AISession.find()
    .populate("chat_id", "topic user_id status")
    .sort({ created_at: -1 });
};

// Get aggregate stats per model (tokens, avg response time)
export const getModelStats = async () => {
  return await AISession.aggregate([
    {
      $group: {
        _id: "$model_name",
        totalTokens: { $sum: "$tokens_used" },
        avgResponseTime: { $avg: "$response_time" },
        totalSessions: { $sum: 1 },
      },
    },
    { $sort: { totalSessions: -1 } },
  ]);
};

// Total tokens used by a chat
export const getTotalTokensByChat = async (chatId) => {
  const result = await AISession.aggregate([
    { $match: { chat_id: chatId } },
    { $group: { _id: null, totalTokens: { $sum: "$tokens_used" } } },
  ]);
  return result[0]?.totalTokens ?? 0;
};

// Delete all AI sessions for a chat
export const deleteSessionsByChat = async (chatId) => {
  const result = await AISession.deleteMany({ chat_id: chatId });
  return { deleted: result.deletedCount };
};
