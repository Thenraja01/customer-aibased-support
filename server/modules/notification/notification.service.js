import Notification from "./notification.schema.js";

export const createNotification = async (data) => {
  return await Notification.create(data);
};

export const broadcastNotification = async (data, userIds) => {
  const notifications = userIds.map((userId) => ({
    user_id: userId,
    title: data.title,
    message: data.message,
    type: data.type || "info",
  }));
  return await Notification.insertMany(notifications);
};

export const getNotificationsByUser = async (userId, options = {}) => {
  const { page, limit, type, unread } = options;
  const filter = { user_id: userId };
  if (type) filter.type = type;
  if (unread === "true") filter.is_read = false;

  if (page && limit) {
    const total = await Notification.countDocuments(filter);
    const notifs = await Notification.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return {
      data: notifs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  return await Notification.find(filter).sort({ created_at: -1 });
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
