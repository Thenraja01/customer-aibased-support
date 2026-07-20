import * as chatService from "./chat.service.js";
import { processAIMessage } from "./aiChat.service.js";
import Message from "../message/message.schema.js";

export const createNewChat = async (req, res) => {
  try {
    const chat = await chatService.createChat(req.body);
    res.status(201).json({ success: true, data: chat });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const processAI = async (req, res) => {
  try {
    const { chatId, message } = req.body;
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;

    if (!chatId || !message) {
      return res.status(400).json({ success: false, message: "chatId and message are required" });
    }

    const aiMessage = await processAIMessage({
      chatId,
      userId,
      userMessage: message,
      organizationId,
    });

    res.status(200).json({ success: true, data: aiMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChats = async (req, res) => {
  try {
    const chats = await chatService.getAllChats();
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActive = async (req, res) => {
  try {
    const chats = await chatService.getActiveChats();
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const search = async (req, res) => {
  try {
    const chats = await chatService.searchChats(req.query.q || "");
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChat = async (req, res) => {
  try {
    const chat = await chatService.getChatById(req.params.id);
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    const status = error.message === "Chat not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getChatsByUserId = async (req, res) => {
  try {
    const chats = await chatService.getChatsByUser(req.params.userId);
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserChatCount = async (req, res) => {
  try {
    const count = await chatService.countUserChats(req.params.userId);
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTopic = async (req, res) => {
  try {
    const updated = await chatService.updateChatTopic(req.params.id, req.body.topic);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const close = async (req, res) => {
  try {
    const closed = await chatService.closeChat(req.params.id);
    res.status(200).json({ success: true, data: closed });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const reopen = async (req, res) => {
  try {
    const reopened = await chatService.reopenChat(req.params.id);
    res.status(200).json({ success: true, data: reopened });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeChat = async (req, res) => {
  try {
    const result = await chatService.deleteChat(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Chat not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const assignAgentToChat = async (req, res) => {
  try {
    const chat = await chatService.assignAgent(req.params.id, req.body.agentId);
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const changePriority = async (req, res) => {
  try {
    const chat = await chatService.updatePriority(req.params.id, req.body.priority);
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const streamChat = async (req, res) => {
  try {
    const { message } = req.body;
    const chatId = req.params.id;
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const chat = await chatService.getChatById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    await Message.create({
      chat_id: chatId,
      sender_id: userId,
      content: message,
      message_type: "text",
      is_ai: false,
    });

    const { streamAIResponse } = await import("../../services/streaming.service.js");

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const stream = streamAIResponse({
      chatId,
      userId,
      userMessage: message,
      organizationId,
    });

    for await (const event of stream) {
      if (event.type === "token") {
        res.write(`data: ${JSON.stringify({ type: "token", content: event.content })}\n\n`);
      } else if (event.type === "done") {
        res.write(`data: ${JSON.stringify({ type: "done", meta: event.meta })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
    }

    res.write(`data: ${JSON.stringify({ type: "done", meta: { intent: "unknown" } })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("[SSE Stream] Error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  }
};

export const escalateChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;
    const { subject, description } = req.body;

    const ticket = await chatService.escalateToTicket(chatId, userId, organizationId, subject, description);
    res.status(201).json({ success: true, data: ticket, message: "Chat escalated to ticket" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
