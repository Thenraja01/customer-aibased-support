import {
  sendMessage,
  getMessagesByChat,
  getPaginatedMessages,
  getLatestMessage,
  countMessages,
  getAIMessages,
  deleteMessage,
  deleteMessagesByChat,
  searchMessages,
} from "../service/message.service.js";
// POST /messages
export const send = async (req, res) => {
  try {
    const { chat_id, sender_type, message } = req.body;
    const msg = await sendMessage({ chat_id, sender_type, message });
    
    res.status(201).json({ 
      success: true, 
      data: msg
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /messages/chat/:chatId
export const getByChat = async (req, res) => {
  try {
    const messages = await getMessagesByChat(req.params.chatId);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /messages/chat/:chatId/paginated?page=1&limit=20
export const getPaginated = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await getPaginatedMessages(req.params.chatId, Number(page), Number(limit));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /messages/chat/:chatId/latest
export const getLatest = async (req, res) => {
  try {
    const msg = await getLatestMessage(req.params.chatId);
    res.status(200).json({ success: true, data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /messages/chat/:chatId/count
export const getCount = async (req, res) => {
  try {
    const count = await countMessages(req.params.chatId);
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /messages/chat/:chatId/ai
export const getAIOnly = async (req, res) => {
  try {
    const messages = await getAIMessages(req.params.chatId);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /messages/chat/:chatId/search?q=keyword
export const search = async (req, res) => {
  try {
    const messages = await searchMessages(req.params.chatId, req.query.q || "");
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /messages/:id
export const remove = async (req, res) => {
  try {
    const result = await deleteMessage(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Message not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// DELETE /messages/chat/:chatId/all
export const removeByChat = async (req, res) => {
  try {
    const result = await deleteMessagesByChat(req.params.chatId);
    res.status(200).json({ success: true, deleted: result.deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
