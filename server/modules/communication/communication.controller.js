import * as communicationService from "./communication.service.js";
import { isAdminUser } from "../../middleware/authorize.middleware.js";

const resolveOrg = (req, fallback) => (isAdminUser(req) ? fallback || null : req.user.organizationId);

export const send = async (req, res) => {
  try {
    const data = {
      sender_id: req.user.userId,
      receiver_id: req.body.receiver_id,
      organization_id: resolveOrg(req, req.body.organization_id) || req.user.organizationId,
      message: req.body.message,
    };
    const msg = await communicationService.sendMessage(data);
    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const sendToOrg = async (req, res) => {
  try {
    const orgId = resolveOrg(req, req.body.organization_id) || req.user.organizationId;
    const { message } = req.body;
    if (!orgId || !message) {
      return res.status(400).json({ success: false, message: "organization_id and message are required" });
    }
    const msg = await communicationService.sendToOrg(req.user.userId, orgId, message);
    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;
    const orgId = req.user.organizationId;
    const messages = await communicationService.getConversation(currentUserId, userId, orgId);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrgConversations = async (req, res) => {
  try {
    const conversations = await communicationService.getOrgConversations();
    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrgMessages = async (req, res) => {
  try {
    const { orgId } = req.params;
    const messages = await communicationService.getOrgMessages(resolveOrg(req, orgId));
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOrgMessages = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) return res.status(400).json({ success: false, message: "No organization found" });
    const messages = await communicationService.getOrgMessages(orgId);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await communicationService.getUnreadCount(req.user.userId);
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnread = async (req, res) => {
  try {
    const messages = await communicationService.getUnreadMessages(req.user.userId);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markRead = async (req, res) => {
  try {
    const msg = await communicationService.markAsRead(req.params.id);
    res.status(200).json({ success: true, data: msg });
  } catch (error) {
    const status = error.message === "Message not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const markOrgSeen = async (req, res) => {
  try {
    const { orgId } = req.params;
    await communicationService.markOrgMessagesAsSeen(resolveOrg(req, orgId), req.user.userId);
    res.status(200).json({ success: true, message: "Messages marked as seen" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const { senderId } = req.body;
    await communicationService.markAllAsRead(req.user.userId, senderId);
    res.status(200).json({ success: true, message: "All messages marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPartners = async (req, res) => {
  try {
    const partnerIds = await communicationService.getConversationPartners(req.user.userId);
    res.status(200).json({ success: true, data: partnerIds });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
