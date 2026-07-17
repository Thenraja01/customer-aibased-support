import * as sessionService from "./aiSession.service.js";

export const create = async (req, res) => {
  try {
    const session = await sessionService.createAISession(req.body);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const sessions = await sessionService.getAllSessions();
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await sessionService.getEnhancedStats(req.user?.organizationId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    const status = error.message === "AI Session not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getByChat = async (req, res) => {
  try {
    const sessions = await sessionService.getSessionsByChat(req.params.chatId);
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChatTokens = async (req, res) => {
  try {
    const total = await sessionService.getTotalTokensByChat(req.params.chatId);
    res.status(200).json({ success: true, data: { totalTokens: total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeByChat = async (req, res) => {
  try {
    const result = await sessionService.deleteSessionsByChat(req.params.chatId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
