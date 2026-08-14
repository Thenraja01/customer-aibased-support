import mongoose from "mongoose";
import { normalizeRoleName, isSuperAdmin } from "../../utils/constants.js";
import * as messageService from "./message.service.js";

export const send = async (req, res) => {
  try {
    const { chat_id } = req.body;
    if (!chat_id) {
      return res.status(400).json({ success: false, message: "chat_id is required" });
    }

    const Chat = mongoose.model("Chat");
    const chat = await Chat.findById(chat_id).lean();
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    const userId = req.user?.userId || req.user?._id;
    const userRole = req.user?.roleName || req.user?.role || "public";
    const normalizedRole = normalizeRoleName(userRole);

    // Verify Organization Scope (Super Admin bypasses organization checks)
    if (!isSuperAdmin(normalizedRole)) {
      const userOrgId = req.user?.organizationId?.toString();
      const chatOrgId = chat.organization_id?.toString();
      if (chatOrgId !== userOrgId) {
        return res.status(403).json({ success: false, message: "Forbidden: Chat belongs to another organization" });
      }

      // Verify Branch Scope for branch_admin, support, customer
      if (normalizedRole !== "admin") {
        const userBranchId = req.user?.branchId?.toString();
        const chatBranchId = chat.branch_id?.toString();
        if (chatBranchId && userBranchId && chatBranchId !== userBranchId) {
          return res.status(403).json({ success: false, message: "Forbidden: Chat belongs to another branch" });
        }
      }

      // Verify ownership for customer role
      if (normalizedRole === "customer") {
        if (chat.user_id?.toString() !== userId.toString()) {
          return res.status(403).json({ success: false, message: "Forbidden: You do not own this chat" });
        }
      }
    }

    const msgData = {
      ...req.body,
      sender_id: userId,
      organization_id: chat.organization_id,
      branch_id: chat.branch_id || null,
    };

    const msg = await messageService.sendMessage(msgData);
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
