import Chat from "./chat.schema.js";
import Message from "../message/message.schema.js";
import AISession from "../ai-session/aiSession.schema.js";
import ChatMemory from "../memory/memory.schema.js";
import { escapeRegex } from "../../utils/escapeRegex.js";

export const createChat = async (data) => {
  return await Chat.create(data);
};

export const getAllChats = async () => {
  return await Chat.find()
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const getChatById = async (id) => {
  const chat = await Chat.findById(id)
    .populate("user_id", "name email")
    .populate("organization_id", "name");
  if (!chat) throw new Error("Chat not found");
  return chat;
};

export const getChatsByUser = async (userId) => {
  return await Chat.find({ user_id: userId }).sort({ created_at: -1 });
};

export const updateChatTopic = async (id, topic) => {
  const chat = await Chat.findByIdAndUpdate(id, { topic }, { new: true });
  if (!chat) throw new Error("Chat not found");
  return chat;
};

export const closeChat = async (id) => {
  const chat = await Chat.findByIdAndUpdate(id, { status: "closed" }, { new: true });
  if (!chat) throw new Error("Chat not found");
  return chat;
};

export const reopenChat = async (id) => {
  const chat = await Chat.findByIdAndUpdate(id, { status: "open" }, { new: true });
  if (!chat) throw new Error("Chat not found");
  return chat;
};

export const deleteChat = async (id) => {
  const chat = await Chat.findByIdAndDelete(id);
  if (!chat) throw new Error("Chat not found");
  await Promise.all([
    Message.deleteMany({ chat_id: id }),
    AISession.deleteMany({ chat_id: id }),
    ChatMemory.deleteMany({ chat_id: id }),
  ]);
  return { message: "Chat and related data deleted successfully" };
};

export const countUserChats = async (userId) => {
  return await Chat.countDocuments({ user_id: userId });
};

export const getActiveChats = async () => {
  return await Chat.find({ status: "open" })
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const searchChats = async (keyword) => {
  const safe = escapeRegex(keyword);
  return await Chat.find({
    topic: { $regex: safe, $options: "i" },
  }).populate("user_id", "name email");
};

export const closeAllUserChats = async (userId) => {
  const result = await Chat.updateMany(
    { user_id: userId, status: "open" },
    { status: "closed" }
  );
  return { closedCount: result.modifiedCount };
};

export const closeInactiveChats = async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const result = await Chat.updateMany(
    {
      status: "open",
      last_message_at: { $lt: thirtyMinutesAgo },
    },
    { status: "closed" }
  );
  return result;
};

export const updateLastMessageTime = async (chatId) => {
  await Chat.findByIdAndUpdate(chatId, { last_message_at: new Date() });
};
