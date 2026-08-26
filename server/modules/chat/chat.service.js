import Chat from "./chat.schema.js";
import Message from "../message/message.schema.js";
import AISession from "../ai-session/aiSession.schema.js";
import ChatMemory from "../memory/memory.schema.js";
import { escapeRegex } from "../../utils/escapeRegex.js";

export const createChat = async (data) => {
  return await Chat.create(data);
};

export const getAllChats = async (orgId = null, branchId = null) => {
  const query = {};
  if (orgId) query.organization_id = orgId;
  if (branchId) query.branch_id = branchId;
  return await Chat.find(query)
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const getChatById = async (id, orgId = null) => {
  const query = { _id: id };
  if (orgId) query.organization_id = orgId;
  const chat = await Chat.findOne(query)
    .populate("user_id", "name email")
    .populate("organization_id", "name");
  if (!chat) throw new Error("Chat not found");
  return chat;
};

export const getChatsByUser = async (userId, orgId = null) => {
  const query = { user_id: userId };
  if (orgId) query.organization_id = orgId;
  return await Chat.find(query).sort({ created_at: -1 });
};

export const updateChatTopic = async (id, topic, orgId = null) => {
  const query = { _id: id };
  if (orgId) query.organization_id = orgId;
  const chat = await Chat.findOneAndUpdate(query, { topic }, { new: true });
  if (!chat) throw new Error("Chat not found");
  return chat;
};

export const closeChat = async (id, orgId = null) => {
  const query = { _id: id };
  if (orgId) query.organization_id = orgId;
  const chat = await Chat.findOneAndUpdate(query, { status: "closed" }, { new: true });
  if (!chat) throw new Error("Chat not found");
  return chat;
};

export const reopenChat = async (id, orgId = null) => {
  const query = { _id: id };
  if (orgId) query.organization_id = orgId;
  const chat = await Chat.findOneAndUpdate(query, { status: "open" }, { new: true });
  if (!chat) throw new Error("Chat not found");
  return chat;
};

export const deleteChat = async (id, orgId = null) => {
  const query = { _id: id };
  if (orgId) query.organization_id = orgId;
  const chat = await Chat.findOneAndDelete(query);
  if (!chat) throw new Error("Chat not found");
  await Promise.all([
    Message.deleteMany({ chat_id: id }),
    AISession.deleteMany({ chat_id: id }),
    ChatMemory.deleteMany({ chat_id: id }),
  ]);
  return { message: "Chat and related data deleted successfully" };
};

export const countUserChats = async (userId, orgId = null) => {
  const query = { user_id: userId };
  if (orgId) query.organization_id = orgId;
  return await Chat.countDocuments(query);
};

export const getActiveChats = async (orgId = null, branchId = null) => {
  const query = { status: { $in: ["open", "escalated", "in_progress", "waiting_for_agent"] } };
  if (orgId) query.organization_id = orgId;
  if (branchId) query.branch_id = branchId;
  return await Chat.find(query)
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const searchChats = async (keyword, orgId = null, branchId = null) => {
  const safe = escapeRegex(keyword);
  const query = {
    topic: { $regex: safe, $options: "i" },
  };
  if (orgId) query.organization_id = orgId;
  if (branchId) query.branch_id = branchId;
  return await Chat.find(query).populate("user_id", "name email");
};

export const closeAllUserChats = async (userId, orgId = null) => {
  const query = { user_id: userId, status: "open" };
  if (orgId) query.organization_id = orgId;
  const result = await Chat.updateMany(
    query,
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

export const deleteAllChats = async (userId, orgId = null) => {
  const query = { user_id: userId };
  if (orgId) query.organization_id = orgId;
  const chats = await Chat.find(query).select("_id");
  const chatIds = chats.map(c => c._id);
  
  await Chat.deleteMany(query);
  await Promise.all([
    Message.deleteMany({ chat_id: { $in: chatIds } }),
    AISession.deleteMany({ chat_id: { $in: chatIds } }),
    ChatMemory.deleteMany({ chat_id: { $in: chatIds } }),
  ]);
  return { deletedCount: chatIds.length, chatIds };
};

