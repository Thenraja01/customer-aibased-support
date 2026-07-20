import Chat from "../modules/chat/chat.schema.js";
import Message from "../modules/message/message.schema.js";
import * as aiChatService from "../modules/chat/aiChat.service.js";

export const handleCreateChat = async (socket, data) => {
  const chat = await Chat.create({
    user_id: socket.user._id,
    organization_id: data.organization_id || socket.user.organization_id,
    topic: data.topic || "General",
  });
  socket.join(`chat:${chat._id}`);
  return chat;
};

export const handleChatMessage = async (socket, data) => {
  const { chatId, message } = data;
  if (!chatId || !message) throw new Error("chatId and message are required");

  const chat = await Chat.findOne({ _id: chatId, is_deleted: { $ne: true } });
  if (!chat) throw new Error("Chat not found");

  socket.join(`chat:${chatId}`);

  const userMessage = await Message.create({
    chat_id: chatId,
    sender_id: socket.user._id,
    content: message,
    message_type: "text",
    is_ai: false,
  });

  const aiMessage = await aiChatService.processAIMessage({
    chatId,
    userId: socket.user._id,
    userMessage: message,
    organizationId: chat.organization_id,
  });

  return {
    userMessage,
    aiMessage: {
      _id: aiMessage._id,
      content: aiMessage.content,
      created_at: aiMessage.created_at,
    },
  };
};

export const handleChatStream = async (socket, data) => {
  const { chatId, message } = data;
  if (!chatId || !message) throw new Error("chatId and message are required");

  const chat = await Chat.findOne({ _id: chatId, is_deleted: { $ne: true } });
  if (!chat) throw new Error("Chat not found");

  socket.join(`chat:${chatId}`);

  const userMessage = await Message.create({
    chat_id: chatId,
    sender_id: socket.user._id,
    content: message,
    message_type: "text",
    is_ai: false,
  });

  socket.emit("chat:user-message", { data: userMessage });

  const { streamAIResponse } = await import("../services/streaming.service.js");
  const generator = streamAIResponse({
    chatId,
    userId: socket.user._id,
    userMessage: message,
    organizationId: chat.organization_id,
  });

  let fullContent = "";

  for await (const event of generator) {
    if (event.type === "token") {
      fullContent += event.content;
      socket.emit("chat:token", { content: event.content });
    } else if (event.type === "done") {
      socket.emit("chat:done", { meta: event.meta, fullContent });
    }
  }
};
