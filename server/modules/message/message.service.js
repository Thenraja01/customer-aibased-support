import Message from "./message.schema.js";
import { escapeRegex } from "../../utils/escapeRegex.js";

export const sendMessage = async (data) => {
  return await Message.create(data);
};

export const getMessagesByChat = async (chatId) => {
  return await Message.find({ chat_id: chatId })
    .populate("sender_id", "name email")
    .sort({ created_at: 1 });
};

export const getPaginatedMessages = async (chatId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  return await Message.find({ chat_id: chatId })
    .populate("sender_id", "name email")
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);
};

export const getLatestMessage = async (chatId) => {
  return await Message.findOne({ chat_id: chatId })
    .populate("sender_id", "name email")
    .sort({ created_at: -1 });
};

export const countMessages = async (chatId) => {
  return await Message.countDocuments({ chat_id: chatId });
};

export const getAIMessages = async (chatId) => {
  return await Message.find({ chat_id: chatId, is_ai: true }).sort({
    created_at: 1,
  });
};

export const updateMessage = async (id, content) => {
  const msg = await Message.findByIdAndUpdate(id, { content }, { new: true });
  if (!msg) throw new Error("Message not found");
  return msg;
};

export const deleteMessage = async (id) => {
  const msg = await Message.findByIdAndDelete(id);
  if (!msg) throw new Error("Message not found");
  return { message: "Message deleted" };
};

export const deleteMessagesByChat = async (chatId) => {
  const result = await Message.deleteMany({ chat_id: chatId });
  return { message: `${result.deletedCount} messages deleted` };
};

export const searchMessages = async (chatId, keyword) => {
  const safe = escapeRegex(keyword);
  return await Message.find({
    chat_id: chatId,
    content: { $regex: safe, $options: "i" },
  }).populate("sender_id", "name email");
};

export const updateFeedback = async (id, feedback) => {
  const msg = await Message.findByIdAndUpdate(id, { feedback }, { new: true });
  if (!msg) throw new Error("Message not found");
  return msg;
};
