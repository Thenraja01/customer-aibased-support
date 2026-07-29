import * as notifService from "./notification.service.js";

const isStaffRole = (roleName) =>
  ["super_admin", "admin", "support"].includes(roleName?.toLowerCase());

export const create = async (req, res) => {
  try {
    const notif = await notifService.createNotification(req.body);
    res.status(201).json({ success: true, data: notif });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const broadcast = async (req, res) => {
  try {
    const { userIds, ...data } = req.body;
    const notifs = await notifService.broadcastNotification(data, userIds);
    res.status(201).json({ success: true, data: notifs });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getByUser = async (req, res) => {
  try {
    if (!isStaffRole(req.user.roleName) && req.user.userId?.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const notifs = await notifService.getNotificationsByUser(req.params.userId);
    res.status(200).json({ success: true, data: notifs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnread = async (req, res) => {
  try {
    if (!isStaffRole(req.user.roleName) && req.user.userId?.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const notifs = await notifService.getUnreadNotifications(req.params.userId);
    res.status(200).json({ success: true, data: notifs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    if (!isStaffRole(req.user.roleName) && req.user.userId?.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const count = await notifService.countUnread(req.params.userId);
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const read = async (req, res) => {
  try {
    const notif = await notifService.getNotificationById(req.params.id);
    if (!isStaffRole(req.user.roleName) && notif.user_id.toString() !== req.user.userId?.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const updated = await notifService.markAsRead(req.params.id);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    const status = error.message === "Notification not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const readAll = async (req, res) => {
  try {
    if (!isStaffRole(req.user.roleName) && req.user.userId?.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const result = await notifService.markAllAsRead(req.params.userId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const notif = await notifService.getNotificationById(req.params.id);
    if (!isStaffRole(req.user.roleName) && notif.user_id.toString() !== req.user.userId?.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const result = await notifService.deleteNotification(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Notification not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const clear = async (req, res) => {
  try {
    if (!isStaffRole(req.user.roleName) && req.user.userId?.toString() !== req.params.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const result = await notifService.clearNotifications(req.params.userId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const broadcastToOrg = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    if (!orgId) {
      return res.status(400).json({ success: false, message: "No organization associated with your account" });
    }
    const notifs = await notifService.broadcastToOrganization(req.body, orgId);
    res.status(201).json({ success: true, data: notifs, count: notifs.length });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const broadcastToAll = async (req, res) => {
  try {
    const notifs = await notifService.broadcastToAll(req.body);
    res.status(201).json({ success: true, data: notifs, count: notifs.length });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const broadcastToOrgById = async (req, res) => {
  try {
    const { orgId } = req.params;
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const notifs = await notifService.broadcastToOrganization(req.body, orgId);
    res.status(201).json({ success: true, data: notifs, count: notifs.length });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
