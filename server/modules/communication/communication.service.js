import Communication from "./communication.schema.js";
import User from "../user/user.schema.js";

const ADMIN_ROLE_NAMES = ["admin", "super_admin"];

export const sendMessage = async (data) => {
  return await Communication.create(data);
};

export const sendToOrg = async (senderId, orgId, message) => {
  const msg = await Communication.create({
    sender_id: senderId,
    organization_id: orgId,
    scope: "org_broadcast",
    message,
    status: "sent",
  });
  return await Communication.findById(msg._id)
    .populate("sender_id", "name email")
    .populate("organization_id", "name");
};

export const sendToBranch = async (senderId, orgId, branchId, message) => {
  const msg = await Communication.create({
    sender_id: senderId,
    organization_id: orgId,
    branch_id: branchId,
    scope: "branch_channel",
    message,
    status: "sent",
  });
  return await Communication.findById(msg._id)
    .populate("sender_id", "name email")
    .populate("organization_id", "name")
    .populate("branch_id", "name");
};

export const getBranchMessages = async (branchId, orgId = null) => {
  const filter = { branch_id: branchId, scope: "branch_channel" };
  if (orgId) filter.organization_id = orgId;
  return await Communication.find(filter)
    .populate("sender_id", "name email")
    .sort({ created_at: 1 });
};

export const markBranchMessagesAsSeen = async (branchId, userId) => {
  await Communication.updateMany(
    { branch_id: branchId, sender_id: { $ne: userId }, status: "sent" },
    { status: "seen", seen_at: new Date() }
  );
};

export const getConversation = async (userId1, userId2, organizationId = null) => {
  const filter = {
    $or: [
      { sender_id: userId1, receiver_id: userId2 },
      { sender_id: userId2, receiver_id: userId1 },
    ],
  };
  if (organizationId) filter.organization_id = organizationId;
  return await Communication.find(filter)
    .populate("sender_id", "name email")
    .populate("receiver_id", "name email")
    .sort({ created_at: 1 });
};

export const getOrgConversations = async () => {
  const conversations = await Communication.aggregate([
    { $sort: { created_at: -1 } },
    {
      $group: {
        _id: "$organization_id",
        last_message: { $first: "$message" },
        last_message_at: { $first: "$created_at" },
        last_sender: { $first: "$sender_id" },
        message_count: { $sum: 1 },
        unread_count: {
          $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] },
        },
      },
    },
    { $sort: { last_message_at: -1 } },
    {
      $lookup: {
        from: "organizations",
        localField: "_id",
        foreignField: "_id",
        as: "organization",
      },
    },
    { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "last_sender",
        foreignField: "_id",
        as: "last_sender_data",
      },
    },
    { $unwind: { path: "$last_sender_data", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        organization_id: "$_id",
        organization_name: "$organization.name",
        last_message: 1,
        last_message_at: 1,
        message_count: 1,
        unread_count: 1,
        last_sender_name: "$last_sender_data.name",
      },
    },
  ]);
  return conversations;
};

export const getOrgMessages = async (orgId) => {
  return await Communication.find({ organization_id: orgId })
    .populate("sender_id", "name email")
    .sort({ created_at: 1 });
};

export const getUnreadCount = async (userId) => {
  return await Communication.countDocuments({ receiver_id: userId, status: "sent" });
};

export const getOrgUnreadCount = async (orgId) => {
  return await Communication.countDocuments({ organization_id: orgId, status: "sent" });
};

export const getUnreadMessages = async (userId) => {
  return await Communication.find({ receiver_id: userId, status: "sent" })
    .populate("sender_id", "name email")
    .sort({ created_at: -1 });
};

export const markAsRead = async (messageId) => {
  const msg = await Communication.findByIdAndUpdate(
    messageId,
    { status: "seen", seen_at: new Date() },
    { new: true }
  );
  if (!msg) throw new Error("Message not found");
  return msg;
};

export const markOrgMessagesAsSeen = async (orgId, userId) => {
  await Communication.updateMany(
    { organization_id: orgId, sender_id: { $ne: userId }, status: "sent" },
    { status: "seen", seen_at: new Date() }
  );
};

export const markAllAsRead = async (userId, senderId) => {
  const filter = { receiver_id: userId, status: "sent" };
  if (senderId) filter.sender_id = senderId;
  await Communication.updateMany(filter, { status: "seen", seen_at: new Date() });
};

export const getConversationPartners = async (userId) => {
  const sent = await Communication.distinct("receiver_id", { sender_id: userId });
  const received = await Communication.distinct("sender_id", { receiver_id: userId });
  const partnerIds = [...new Set([...sent, ...received])];
  return partnerIds;
};
