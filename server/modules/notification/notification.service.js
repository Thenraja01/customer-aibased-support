import Notification from "./notification.schema.js";
import User from "../user/user.schema.js";
import { getIO } from "../../config/socket.js";
import { sendPushNotification, sendMulticastNotification } from "../../config/firebase.js";
import NotificationCampaign from "./notification-campaign.schema.js";
import NotificationTemplate from "./notification-template.schema.js";
import { deliveryService } from "./delivery.service.js";

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
    organization_id: data.organization_id || null,
    branch_id: data.branch_id || null,
    title: data.title,
    message: data.message,
    type: data.type || "info",
    link: data.link,
  }));
  const created = await Notification.insertMany(notifications);

  // Emit real-time Socket.io events
  try {
    const io = getIO();
    created.forEach((notif) => {
      io.to(`user:${notif.user_id}`).emit("notification", notif);
    });
  } catch {
    // socket not available
  }

  // Send FCM multicast push notification to all users who have a device token
  try {
    const recipients = await User.find(
      { _id: { $in: userIds }, fcm_token: { $ne: null } },
      { fcm_token: 1 }
    ).lean();
    const tokens = recipients.map((u) => u.fcm_token).filter(Boolean);
    if (tokens.length > 0) {
      await sendMulticastNotification(tokens, {
        title: data.title,
        body: data.message,
        data: { type: data.type || "info", link: data.link || "" },
      });
    }
  } catch {
    // push notification error — do not break the broadcast
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

export const resolveAudienceUsers = async (organizationId, filter) => {
  const { audienceType, branchIds, roleIds } = filter;

  const query = {
    organization_id: organizationId,
    status: "active"
  };

  if (audienceType === "branch") {
    if (!branchIds || branchIds.length === 0) return [];
    query.branch_id = { $in: branchIds };
  } else if (audienceType === "role") {
    if (!roleIds || roleIds.length === 0) return [];
    query.role = { $in: roleIds.map(r => r.toLowerCase()) };
  } else if (audienceType === "branch_role") {
    if (!branchIds || branchIds.length === 0 || !roleIds || roleIds.length === 0) return [];
    query.branch_id = { $in: branchIds };
    query.role = { $in: roleIds.map(r => r.toLowerCase()) };
  }

  return await User.find(query, { _id: 1, fcm_token: 1, email: 1, phone: 1 }).lean();
};

export const broadcastToOrganization = async (data, organizationId, createdBy = null) => {
  const audienceFilter = {
    audienceType: data.audienceType || "all",
    branchIds: data.branchIds || [],
    roleIds: data.roleIds || [],
  };

  const targetUsers = await resolveAudienceUsers(organizationId, audienceFilter);
  const userIds = targetUsers.map((u) => u._id);

  if (userIds.length === 0) return [];

  // Create campaign log record
  const campaign = await NotificationCampaign.create({
    organization_id: organizationId,
    audience_type: data.audienceType || "all",
    branch_ids: data.branchIds || [],
    role_ids: data.roleIds || [],
    type: data.type || "info",
    title: data.title,
    message: data.message,
    delivery_methods: data.deliveryMethods || ["in_app"],
    cta_text: data.ctaText || "",
    cta_url: data.ctaUrl || data.link || "",
    status: "sent",
    created_by: createdBy || userIds[0],
  });

  const deliveryMethods = data.deliveryMethods || ["in_app"];
  let createdInAppNotifications = [];

  if (deliveryMethods.includes("in_app")) {
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      organization_id: organizationId,
      title: data.title,
      message: data.message,
      type: data.type || "info",
      link: data.ctaUrl || data.link || "",
    }));
    createdInAppNotifications = await Notification.insertMany(notifications);

    try {
      const io = getIO();
      createdInAppNotifications.forEach((notif) => {
        io.to(`user:${notif.user_id}`).emit("notification", notif);
      });
    } catch {
      // socket not available
    }
  }

  if (deliveryMethods.includes("email")) {
    await deliveryService.sendEmail(data, targetUsers);
  }

  if (deliveryMethods.includes("push")) {
    await deliveryService.sendPush(data, targetUsers);
  }

  if (deliveryMethods.includes("system")) {
    await deliveryService.sendSystemAnnouncement(data, targetUsers);
  }

  return createdInAppNotifications.length > 0 ? createdInAppNotifications : [{ _id: campaign._id, campaign: true }];
};

export const getCampaignHistory = async (organizationId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const items = await NotificationCampaign.find({ organization_id: organizationId })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .populate("created_by", "name email")
    .lean();
  
  const total = await NotificationCampaign.countDocuments({ organization_id: organizationId });

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  };
};

export const getCampaignById = async (campaignId, organizationId) => {
  const campaign = await NotificationCampaign.findOne({ _id: campaignId, organization_id: organizationId })
    .populate("created_by", "name email")
    .lean();
  if (!campaign) throw new Error("Campaign notification not found");
  return campaign;
};

export const getTemplates = async (organizationId) => {
  return await NotificationTemplate.find({ organization_id: organizationId })
    .sort({ created_at: -1 })
    .lean();
};

export const createTemplate = async (data, organizationId, createdBy) => {
  return await NotificationTemplate.create({
    ...data,
    organization_id: organizationId,
    created_by: createdBy,
  });
};

export const deleteTemplate = async (templateId, organizationId) => {
  const deleted = await NotificationTemplate.findOneAndDelete({ _id: templateId, organization_id: organizationId });
  if (!deleted) throw new Error("Template not found or unauthorized");
  return { message: "Template deleted successfully" };
};

export const broadcastToAll = async (data) => {
  const users = await User.find(
    { status: "active" },
    { _id: 1, fcm_token: 1, organization_id: 1 }
  ).lean();

  const userIds = users.map((u) => u._id);
  if (userIds.length === 0) return [];

  const notifications = userIds.map((userId, idx) => ({
    user_id: userId,
    organization_id: users[idx].organization_id,
    title: data.title,
    message: data.message,
    type: data.type || "info",
    link: data.link,
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

  try {
    const tokens = users.map((u) => u.fcm_token).filter(Boolean);
    if (tokens.length > 0) {
      await sendMulticastNotification(tokens, {
        title: data.title,
        body: data.message,
        data: { type: data.type || "info", link: data.link || "" },
      });
    }
  } catch {
    // push notification error
  }

  return created;
};

export const notifyAdminsOnSystemError = async ({ organizationId, title, message, type = "error", link = "" }) => {
  try {
    const query = { role: { $in: ["admin", "super_admin", "branch_admin"] } };
    if (organizationId) query.organization_id = organizationId;

    const adminUsers = await User.find(query).select("_id").lean();
    if (!adminUsers || adminUsers.length === 0) return [];

    const notifications = adminUsers.map((u) => ({
      user_id: u._id,
      organization_id: organizationId || null,
      title: title || "System Error Notification",
      message: message || "An unexpected error occurred in the system.",
      type: type,
      link: link || "/admin/ai-intelligence",
    }));

    const created = await Notification.insertMany(notifications);
    try {
      const io = getIO();
      created.forEach((notif) => {
        io.to(`user:${notif.user_id}`).emit("notification", notif);
      });
    } catch {
      // socket fallback
    }
    return created;
  } catch (err) {
    console.error("[NotifyAdmins] Error sending admin notification:", err.message);
    return [];
  }
};
