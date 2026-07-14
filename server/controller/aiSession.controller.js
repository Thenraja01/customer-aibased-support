import {
  createAISession,
  getSessionsByChat,
  getSessionById,
  getAllSessions,
  getModelStats,
  getTotalTokensByChat,
  deleteSessionsByChat,
} from "../service/aiSession.service.js";

// POST /ai-sessions
export const create = async (req, res) => {
  try {
    const session = await createAISession(req.body);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /ai-sessions
export const getAll = async (req, res) => {
  try {
    const sessions = await getAllSessions();
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /ai-sessions/stats
export const getStats = async (req, res) => {
  try {
    const stats = await getModelStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /ai-sessions/:id
export const getById = async (req, res) => {
  try {
    const session = await getSessionById(req.params.id);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    const status = error.message === "AI session not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// GET /ai-sessions/chat/:chatId
export const getByChat = async (req, res) => {
  try {
    const sessions = await getSessionsByChat(req.params.chatId);
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /ai-sessions/chat/:chatId/tokens
export const getChatTokens = async (req, res) => {
  try {
    const total = await getTotalTokensByChat(req.params.chatId);
    res.status(200).json({ success: true, totalTokens: total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeByChat = async (req, res) => {
  try {
    const result = await deleteSessionsByChat(req.params.chatId);
    res.status(200).json({ success: true, deleted: result.deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
