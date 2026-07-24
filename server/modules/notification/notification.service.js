import Notification from "./notification.schema.js";
import User from "../user/user.schema.js";
import { getIO } from "../../config/socket.js";
import { sendPushNotification } from "../../config/firebase.js";

export const createNotification = async (data) => {
  const notif = await Notification.create(data);
  try {
    const io = getIO();
    io.to(`user:${data.user_id}`).emit("notification", notif);
  } catch {
    // socket not available
  }

  try {
    const recipient = await User.findById(data.user_id).select("fcm_token");
    if (recipient?.fcm_token) {
      await sendPushNotification(recipient.fcm_token, {
        title: data.title,
        body: data.message,
        data: { link: data.link || "" },
      });
    }
  } catch {
    // push notification error
  }

  return notif;
};

export const broadcastNotification = async (data, userIds) => {
  const notifications = userIds.map((userId) => ({
    user_id: userId,
    title: data.title,
    message: data.message,
    type: data.type || "info",
  }));
  const created = await Notification.insertMany(notifications);
  try {
    const io = getIO();
    created.forEach((notif) => {
      io.to(`user:${notif.user_id}`).emit("notification", notif);
    });
  } catch {
    // socket not available
  }
  return created;
};

export const getNotificationsByUser = async (userId) => {
  return await Notification.find({ user_id: userId }).sort({ created_at: -1 });
};

export const getUnreadNotifications = async (userId) => {
  return await Notification.find({ user_id: userId, is_read: false }).sort({
    created_at: -1,
  });
};

export const countUnread = async (userId) => {
  return await Notification.countDocuments({ user_id: userId, is_read: false });
};

export const getNotificationById = async (id) => {
  const notif = await Notification.findById(id);
  if (!notif) throw new Error("Notification not found");
  return notif;
};

export const markAsRead = async (id) => {
  const notif = await Notification.findByIdAndUpdate(
    id,
    { is_read: true },
    { new: true }
  );
  if (!notif) throw new Error("Notification not found");
  return notif;
};

export const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { user_id: userId, is_read: false },
    { is_read: true }
  );
  return { message: "All notifications marked as read" };
};

export const deleteNotification = async (id) => {
  const notif = await Notification.findByIdAndDelete(id);
  if (!notif) throw new Error("Notification not found");
  return { message: "Notification deleted" };
};

export const clearNotifications = async (userId) => {
  await Notification.deleteMany({ user_id: userId });
  return { message: "All notifications cleared" };
};
