import * as chatService from "./chat.service.js";
import { processAIMessage } from "./aiChat.service.js";
import Chat from "./chat.schema.js";
import { processOrchestratedMessage } from "../../services/ai/aiOrchestrator.js";

export const createNewChat = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const branchId = req.user?.branchId || null;
    const userId = req.user?.userId || req.user?._id;

    const chatData = {
      ...req.body,
      user_id: userId,
      organization_id: orgId,
      branch_id: branchId,
    };

    const chat = await chatService.createChat(chatData);
    res.status(201).json({ success: true, data: chat });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const processAI = async (req, res) => {
  try {
    const { chatId, message, model, actionConfirm } = req.body;
    const userId = req.user?.userId || null;
    const organizationId = req.user?.organizationId || req.organizationId || null;

    if (!chatId || !message) {
      return res.status(400).json({ success: false, message: "chatId and message are required" });
    }

    // Retrieve the chat session to determine if it is a copilot session
    const chat = await Chat.findById(chatId).lean();
    if (chat && chat.is_copilot) {
      const result = await processOrchestratedMessage({
        chatId,
        user: req.user,
        message,
        modelName: model,
        actionConfirm
      });
      return res.status(200).json({ success: true, data: result });
    }

    const aiMessage = await processAIMessage({
      chatId,
      userId,
      userMessage: message,
      organizationId,
      roleName: req.user?.roleName,
      roleId: req.user?.roleId,
    });

    res.status(200).json({ success: true, data: aiMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const processAIStream = async (req, res) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
      return res.status(400).json({ success: false, message: "chatId and message are required" });
    }

    const { processAIStream: runAIStream } = await import("../../services/ai/aiStreaming.service.js");
    await runAIStream(req, res);
  } catch (error) {
    console.error("[StreamingAI Controller] Error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const getChats = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : (req.user?.organizationId || req.user?.organization_id);
    const branchId = (req.scope?.isSuperAdmin || req.scope?.isOrgAdmin) ? null : (req.user?.branchId || req.user?.branch_id);
    const chats = await chatService.getAllChats(orgId, branchId);
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActive = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : (req.user?.organizationId || req.user?.organization_id);
    const branchId = (req.scope?.isSuperAdmin || req.scope?.isOrgAdmin) ? null : (req.user?.branchId || req.user?.branch_id);
    const chats = await chatService.getActiveChats(orgId, branchId);
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const search = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : (req.user?.organizationId || req.user?.organization_id);
    const branchId = (req.scope?.isSuperAdmin || req.scope?.isOrgAdmin) ? null : (req.user?.branchId || req.user?.branch_id);
    const chats = await chatService.searchChats(req.query.q || "", orgId, branchId);
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChat = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : (req.user?.organizationId || req.user?.organization_id);
    const chat = await chatService.getChatById(req.params.id, orgId);
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    const status = error.message === "Chat not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getChatsByUserId = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : (req.user?.organizationId || req.user?.organization_id);
    const chats = await chatService.getChatsByUser(req.params.userId, orgId);
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserChatCount = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : (req.user?.organizationId || req.user?.organization_id);
    const count = await chatService.countUserChats(req.params.userId, orgId);
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTopic = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : (req.user?.organizationId || req.user?.organization_id);
    const updated = await chatService.updateChatTopic(req.params.id, req.body.topic, orgId);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const close = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : (req.user?.organizationId || req.user?.organization_id);
    const closed = await chatService.closeChat(req.params.id, orgId);
    res.status(200).json({ success: true, data: closed });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const reopen = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : (req.user?.organizationId || req.user?.organization_id);
    const reopened = await chatService.reopenChat(req.params.id, orgId);
    res.status(200).json({ success: true, data: reopened });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const closeAll = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orgId = req.scope?.isSuperAdmin ? null : (req.user?.organizationId || req.user?.organization_id);
    const result = await chatService.closeAllUserChats(userId, orgId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeChat = async (req, res) => {
  try {
    const orgId = req.scope?.isSuperAdmin ? null : (req.user?.organizationId || req.user?.organization_id);
    const result = await chatService.deleteChat(req.params.id, orgId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Chat not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
