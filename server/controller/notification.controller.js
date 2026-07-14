import {
  createNotification,
  broadcastNotification,
  getNotificationsByUser,
  getUnreadNotifications,
  countUnread,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} from "../service/notification.service.js";

// POST /notifications
export const create = async (req, res) => {
  try {
    const note = await createNotification(req.body);
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /notifications/broadcast
export const broadcast = async (req, res) => {
  try {
    const { user_ids, title, message } = req.body;
    const result = await broadcastNotification(user_ids, title, message);
    res.status(201).json({ success: true, sent: result.length });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /notifications/user/:userId
export const getByUser = async (req, res) => {
  try {
    const notes = await getNotificationsByUser(req.params.userId);
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /notifications/user/:userId/unread
export const getUnread = async (req, res) => {
  try {
    const notes = await getUnreadNotifications(req.params.userId);
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /notifications/user/:userId/count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await countUnread(req.params.userId);
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /notifications/:id/read
export const read = async (req, res) => {
  try {
    const note = await markAsRead(req.params.id);
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    const status = error.message === "Notification not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// PATCH /notifications/user/:userId/read-all
export const readAll = async (req, res) => {
  try {
    const result = await markAllAsRead(req.params.userId);
    res.status(200).json({ success: true, updated: result.updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /notifications/:id
export const remove = async (req, res) => {
  try {
    const result = await deleteNotification(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Notification not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// DELETE /notifications/user/:userId/clear
export const clear = async (req, res) => {
  try {
    const result = await clearNotifications(req.params.userId);
    res.status(200).json({ success: true, deleted: result.deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
