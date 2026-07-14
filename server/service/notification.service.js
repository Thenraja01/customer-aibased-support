import Notification from "../schema/Notification.schema.js";

// Create a notification for a user
export const createNotification = async ({ user_id, title, message }) => {
  return await Notification.create({ user_id, title, message, status: "unread" });
};

// Send a notification to multiple users at once
export const broadcastNotification = async (userIds, title, message) => {
  const notifications = userIds.map((user_id) => ({
    user_id,
    title,
    message,
    status: "unread",
  }));
  return await Notification.insertMany(notifications);
};

// Get all notifications for a user
export const getNotificationsByUser = async (userId) => {
  return await Notification.find({ user_id: userId }).sort({ created_at: -1 });
};

// Get only unread notifications for a user
export const getUnreadNotifications = async (userId) => {
  return await Notification.find({
    user_id: userId,
    status: "unread",
  }).sort({ created_at: -1 });
};

// Count unread notifications (for badge)
export const countUnread = async (userId) => {
  return await Notification.countDocuments({ user_id: userId, status: "unread" });
};

// Mark a single notification as read
export const markAsRead = async (notificationId) => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { status: "read" },
    { new: true }
  );
  if (!notification) throw new Error("Notification not found");
  return notification;
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user_id: userId, status: "unread" },
    { status: "read" }
  );
  return { updated: result.modifiedCount };
};

// Delete a single notification
export const deleteNotification = async (notificationId) => {
  const notification = await Notification.findByIdAndDelete(notificationId);
  if (!notification) throw new Error("Notification not found");
  return { message: "Notification deleted" };
};

// Delete all notifications for a user
export const clearNotifications = async (userId) => {
  const result = await Notification.deleteMany({ user_id: userId });
  return { deleted: result.deletedCount };
};
