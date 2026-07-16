import AISession from "./aiSession.schema.js";

export const createAISession = async (data) => {
  return await AISession.create(data);
};

export const getSessionsByChat = async (chatId) => {
  return await AISession.find({ chat_id: chatId }).sort({ created_at: -1 });
};

export const getSessionById = async (id) => {
  const session = await AISession.findById(id);
  if (!session) throw new Error("AI Session not found");
  return session;
};

export const getAllSessions = async () => {
  return await AISession.find()
    .populate("chat_id")
    .sort({ created_at: -1 });
};

export const getModelStats = async () => {
  return await AISession.aggregate([
    { $group: { _id: "$model", count: { $sum: 1 }, totalTokens: { $sum: "$tokens_used" } } },
  ]);
};

export const getTotalTokensByChat = async (chatId) => {
  const result = await AISession.aggregate([
    { $match: { chat_id: chatId } },
    { $group: { _id: null, total: { $sum: "$tokens_used" } } },
  ]);
  return result[0]?.total || 0;
};

export const deleteSessionsByChat = async (chatId) => {
  await AISession.deleteMany({ chat_id: chatId });
  return { message: "Sessions deleted" };
};
