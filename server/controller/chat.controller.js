import {
  createChat,
  getAllChats,
  getChatById,
  getChatsByUser,
  updateChatTopic,
  closeChat,
  reopenChat,
  deleteChat,
  getActiveChats,
  searchChats,
  countUserChats,
} from "../service/chat.service.js";

// POST /chats
export const createNewChat = async (req, res) => {
  try {
    const chat = await createChat(req.body);
    res.status(201).json({ success: true, data: chat });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /chats
export const getChats = async (req, res) => {
  try {
    const chats = await getAllChats();
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /chats/active
export const getActive = async (req, res) => {
  try {
    const chats = await getActiveChats();
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /chats/search?q=keyword
export const search = async (req, res) => {
  try {
    const chats = await searchChats(req.query.q || "");
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /chats/:id
export const getChat = async (req, res) => {
  try {
    const chat = await getChatById(req.params.id);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /chats/user/:userId
export const getChatsByUserId = async (req, res) => {
  try {
    const chats = await getChatsByUser(req.params.userId);
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /chats/user/:userId/count
export const getUserChatCount = async (req, res) => {
  try {
    const count = await countUserChats(req.params.userId);
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /chats/:id/topic
export const updateTopic = async (req, res) => {
  try {
    const chat = await updateChatTopic(req.params.id, req.body.topic);
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /chats/:id/close
export const close = async (req, res) => {
  try {
    const chat = await closeChat(req.params.id);
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /chats/:id/reopen
export const reopen = async (req, res) => {
  try {
    const chat = await reopenChat(req.params.id);
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /chats/:id
export const removeChat = async (req, res) => {
  try {
    await deleteChat(req.params.id);
    res.status(200).json({ success: true, message: "Chat deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
