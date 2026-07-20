import Chat from "./chat.schema.js";
import Message from "../message/message.schema.js";
import AISession from "../ai-session/aiSession.schema.js";
import ChatMemory from "../memory/memory.schema.js";
import { escapeRegex } from "../../utils/escapeRegex.js";
import { chatCompletion } from "../../utils/llm.utils.js";

export const createChat = async (data) => {
  return await Chat.create(data);
};

export const getAllChats = async () => {
  return await Chat.find({ is_deleted: { $ne: true } })
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

export const getChatById = async (id) => {
  const chat = await Chat.findOne({ _id: id, is_deleted: { $ne: true } })
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .populate("organization_id", "name");
  if (!chat) throw new Error("Chat not found");
  return chat;
};

export const getChatsByUser = async (userId) => {
  return await Chat.find({ user_id: userId, is_deleted: { $ne: true } }).sort({ created_at: -1 });
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
  const chat = await Chat.findByIdAndUpdate(
    id,
    { is_deleted: true, deleted_at: new Date() },
    { new: true }
  );
  if (!chat) throw new Error("Chat not found");
  return { message: "Chat soft-deleted" };
};

export const hardDeleteChat = async (id) => {
  const chat = await Chat.findByIdAndDelete(id);
  if (!chat) throw new Error("Chat not found");
  await Promise.all([
    Message.deleteMany({ chat_id: id }),
    AISession.deleteMany({ chat_id: id }),
    ChatMemory.deleteMany({ chat_id: id }),
  ]);
  return { message: "Chat and related data permanently deleted" };
};

export const countUserChats = async (userId) => {
  return await Chat.countDocuments({ user_id: userId, is_deleted: { $ne: true } });
};

export const getActiveChats = async () => {
  return await Chat.find({ status: "open", is_deleted: { $ne: true } })
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

export const searchChats = async (keyword) => {
  const safe = escapeRegex(keyword);
  return await Chat.find({
    is_deleted: { $ne: true },
    topic: { $regex: safe, $options: "i" },
  }).populate("user_id", "name email");
};

export const assignAgent = async (chatId, agentId) => {
  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { assigned_to: agentId, status: "open" },
    { new: true }
  ).populate("assigned_to", "name email");
  if (!chat) throw new Error("Chat not found");
  return chat;
};

export const updatePriority = async (chatId, priority) => {
  const chat = await Chat.findByIdAndUpdate(chatId, { priority }, { new: true });
  if (!chat) throw new Error("Chat not found");
  return chat;
};

export const generateChatTitle = async (chatId, userMessage) => {
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return null;
    if (chat.topic && chat.topic !== "General" && chat.topic !== "New Chat") return chat.topic;

    const response = await chatCompletion({
      messages: [
        {
          role: "system",
          content: "Generate a very short, concise title (max 6 words) for a customer support conversation based on the user's first message. Return ONLY the title, no quotes, no punctuation, no explanation.",
        },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      maxTokens: 30,
    });

    const title = response.content.trim().replace(/^["']|["']$/g, "");
    if (title && title.length > 0) {
      await Chat.findByIdAndUpdate(chatId, { topic: title });
      return title;
    }
  } catch (err) {
    console.error("[ChatTitle] Failed to generate title:", err.message);
  }
  return null;
};

export const escalateToTicket = async (chatId, userId, organizationId, subject, description) => {
  const Ticket = (await import("../ticket/ticket.schema.js")).default;
  const ticket = await Ticket.create({
    user_id: userId,
    organization_id: organizationId,
    chat_id: chatId,
    subject: subject || "Escalated from chat",
    description: description || "Customer requested escalation from chat",
    status: "open",
    priority: "medium",
    source: "chat",
  });
  await Chat.findByIdAndUpdate(chatId, { status: "escalated" });
  return ticket;
};
