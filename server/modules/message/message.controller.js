import * as messageService from "./message.service.js";

export const send = async (req, res) => {
  try {
    const msg = await messageService.sendMessage(req.body);
    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getByChat = async (req, res) => {
  try {
    const msgs = await messageService.getMessagesByChat(req.params.chatId);
    res.status(200).json({ success: true, data: msgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaginated = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const msgs = await messageService.getPaginatedMessages(req.params.chatId, Number(page) || 1, Number(limit) || 50);
    res.status(200).json({ success: true, data: msgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLatest = async (req, res) => {
  try {
    const msg = await messageService.getLatestMessage(req.params.chatId);
    res.status(200).json({ success: true, data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCount = async (req, res) => {
  try {
    const count = await messageService.countMessages(req.params.chatId);
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAIOnly = async (req, res) => {
  try {
    const msgs = await messageService.getAIMessages(req.params.chatId);
    res.status(200).json({ success: true, data: msgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const search = async (req, res) => {
  try {
    const msgs = await messageService.searchMessages(req.params.chatId, req.query.q || "");
    res.status(200).json({ success: true, data: msgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const msg = await messageService.updateMessage(req.params.id, req.body.content);
    res.status(200).json({ success: true, data: msg });
  } catch (error) {
    const status = error.message === "Message not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await messageService.deleteMessage(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Message not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const removeByChat = async (req, res) => {
  try {
    const result = await messageService.deleteMessagesByChat(req.params.chatId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
