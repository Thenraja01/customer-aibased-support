import User from "../user/user.schema.js";
import Organization from "../organization/organization.schema.js";
import Role from "../role/role.schema.js";
import Ticket from "../ticket/ticket.schema.js";
import Document from "../document/document.schema.js";
import DocumentVerification from "../document-verification/documentVerification.schema.js";
import ChatAnalytics from "../chat-analytics/chatAnalytics.schema.js";
import AISession from "../ai-session/aiSession.schema.js";
import APIUsage from "../api-usage/apiUsage.schema.js";
import AuditLog from "../audit-log/auditLog.schema.js";
import { escapeRegex } from "../../utils/escapeRegex.js";

export const getDashboardStats = async () => {
  const [totalUsers, totalOrgs, totalRoles, recentLogs, blockedUsers, activeUsers] =
    await Promise.all([
      User.countDocuments({ is_deleted: { $ne: true } }),
      Organization.countDocuments(),
      Role.countDocuments(),
      AuditLog.countDocuments(),
      User.countDocuments({ is_deleted: { $ne: true }, status: "blocked" }),
      User.countDocuments({ is_deleted: { $ne: true }, status: "active" }),
    ]);

  const orgs = await Organization.find()
    .select("name organization_id")
    .lean();

  const orgUserCounts = await User.aggregate([
    { $match: { is_deleted: { $ne: true } } },
    { $group: { _id: "$organization_id", count: { $sum: 1 } } },
  ]);

  const orgStats = orgs.map((org) => {
    const match = orgUserCounts.find(
      (o) => o._id.toString() === org._id.toString()
    );
    return {
      organizationId: org._id,
      name: org.name,
      organization_id: org.organization_id,
      userCount: match ? match.count : 0,
    };
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentActivity = await AuditLog.countDocuments({
    created_at: { $gte: sevenDaysAgo },
  });

  return {
    totalUsers,
    totalOrgs,
    totalRoles,
    blockedUsers,
    activeUsers,
    recentLogs,
    recentActivity,
    orgStats,
  };
};

export const getAnalyticsDashboard = async (organizationId) => {
  const match = organizationId ? { organization_id: organizationId } : {};

  const [tokenStats, chatStats, apiStats, docStats, ticketStats, userStats] =
    await Promise.all([
      AISession.aggregate([
        { $match: match },
        { $group: { _id: null, totalTokens: { $sum: "$tokens_used" }, totalSessions: { $sum: 1 }, avgTokensPerSession: { $avg: "$tokens_used" } } },
      ]),
      ChatAnalytics.aggregate([
        { $match: match },
        { $group: { _id: null, totalChats: { $sum: 1 }, avgMessages: { $avg: "$total_messages" }, avgResponseTime: { $avg: "$avg_response_time_ms" }, avgResolutionTime: { $avg: "$resolution_time_ms" }, totalEscalations: { $sum: "$escalation_count" } } },
      ]),
      APIUsage.aggregate([
        { $match: match },
        { $group: { _id: null, totalCalls: { $sum: 1 }, avgResponseTime: { $avg: "$response_time_ms" } } },
      ]),
      Document.aggregate([
        { $match: { ...match, is_deleted: { $ne: true } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: { ...match, is_deleted: { $ne: true } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { ...match, is_deleted: { $ne: true } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

  const docStatusMap = {};
  docStats.forEach((d) => { docStatusMap[d._id] = d.count; });
  const ticketStatusMap = {};
  ticketStats.forEach((t) => { ticketStatusMap[t._id] = t.count; });
  const userStatusMap = {};
  userStats.forEach((u) => { userStatusMap[u._id] = u.count; });

  const tokenData = tokenStats[0] || {};
  const chatData = chatStats[0] || {};
  const apiData = apiStats[0] || {};

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [dailyTokens, dailyChats, dailyDocuments, userGrowth] = await Promise.all([
    AISession.aggregate([
      { $match: { ...match, created_at: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, tokens: { $sum: "$tokens_used" }, sessions: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    ChatAnalytics.aggregate([
      { $match: { ...match, created_at: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, chats: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Document.aggregate([
      { $match: { ...match, created_at: { $gte: thirtyDaysAgo }, is_deleted: { $ne: true } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, uploads: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: { ...match, created_at: { $gte: thirtyDaysAgo }, is_deleted: { $ne: true } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, signups: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    usage: {
      totalTokens: tokenData.totalTokens || 0,
      totalSessions: tokenData.totalSessions || 0,
      totalChats: chatData.totalChats || 0,
      totalApiCalls: apiData.totalCalls || 0,
      totalEscalations: chatData.totalEscalations || 0,
    },
    performance: {
      avgResponseTimeMs: Math.round(chatData.avgResponseTime || apiData.avgResponseTime || 0),
      avgResolutionTimeMs: Math.round(chatData.avgResolutionTime || 0),
      avgTokensPerSession: Math.round(tokenData.avgTokensPerSession || 0),
      avgMessagesPerChat: Math.round(chatData.avgMessages || 0),
    },
    documents: {
      byStatus: docStatusMap,
      total: Object.values(docStatusMap).reduce((a, b) => a + b, 0),
    },
    tickets: {
      byStatus: ticketStatusMap,
      total: Object.values(ticketStatusMap).reduce((a, b) => a + b, 0),
    },
    users: {
      byStatus: userStatusMap,
      total: Object.values(userStatusMap).reduce((a, b) => a + b, 0),
    },
    trends: {
      dailyTokens,
      dailyChats,
      dailyDocuments,
      userGrowth,
    },
  };
};

export const getDocumentAnalytics = async (organizationId) => {
  const match = organizationId ? { organization_id: organizationId } : {};
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [byType, byStatus, uploadsOverTime, verificationStats] = await Promise.all([
    Document.aggregate([
      { $match: { ...match, is_deleted: { $ne: true } } },
      { $group: { _id: "$document_type_id", count: { $sum: 1 } } },
    ]),
    Document.aggregate([
      { $match: { ...match, is_deleted: { $ne: true } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Document.aggregate([
      { $match: { ...match, created_at: { $gte: thirtyDaysAgo }, is_deleted: { $ne: true } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    DocumentVerification.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);

  return { byType, byStatus, uploadsOverTime, verificationStats };
};

export const getTicketAnalytics = async (organizationId) => {
  const match = organizationId ? { organization_id: organizationId } : {};

  const [byStatus, byPriority, byAgent, resolutionTime, slaData] = await Promise.all([
    Ticket.aggregate([
      { $match: { ...match, is_deleted: { $ne: true } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Ticket.aggregate([
      { $match: { ...match, is_deleted: { $ne: true } } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),
    Ticket.aggregate([
      { $match: { ...match, is_deleted: { $ne: true }, assigned_to: { $ne: null } } },
      { $group: { _id: "$assigned_to", ticketCount: { $sum: 1 }, resolvedCount: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } } } },
      { $sort: { ticketCount: -1 } },
    ]),
    Ticket.aggregate([
      { $match: { ...match, resolved_at: { $ne: null }, is_deleted: { $ne: true } } },
      { $project: { resolutionHours: { $divide: [{ $subtract: ["$resolved_at", "$created_at"] }, 3600000] } } },
      { $group: { _id: null, avgHours: { $avg: "$resolutionHours" }, maxHours: { $max: "$resolutionHours" }, minHours: { $min: "$resolutionHours" }, total: { $sum: 1 } } },
    ]),
    Ticket.aggregate([
      { $match: { ...match, is_deleted: { $ne: true } } },
      { $group: { _id: null, breached: { $sum: { $cond: ["$sla_breached", 1, 0] } }, total: { $sum: 1 } } },
    ]),
  ]);

  return { byStatus, byPriority, byAgent, resolutionTime: resolutionTime[0] || {}, slaData: slaData[0] || {} };
};

export const getUserAnalytics = async (organizationId) => {
  const match = organizationId ? { organization_id: organizationId } : {};
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [byRole, byStatus, growth, activeUsers, total] = await Promise.all([
    User.aggregate([
      { $match: { ...match, is_deleted: { $ne: true } } },
      { $group: { _id: "$role_id", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { ...match, is_deleted: { $ne: true } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { ...match, created_at: { $gte: thirtyDaysAgo }, is_deleted: { $ne: true } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    User.countDocuments({ ...match, last_active_at: { $gte: thirtyDaysAgo }, is_deleted: { $ne: true } }),
    User.countDocuments({ ...match, is_deleted: { $ne: true } }),
  ]);

  return { byRole, byStatus, growth, activeUsers, total };
};

export const getAllOrgsPaginated = async (page = 1, limit = 10, search = "") => {
  const query = search ? { name: { $regex: escapeRegex(search), $options: "i" } } : {};
  const total = await Organization.countDocuments(query);
  const orgs = await Organization.find(query)
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: orgs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getOrgUsers = async (orgId, page = 1, limit = 10) => {
  const query = { organization_id: orgId, is_deleted: { $ne: true } };
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .populate("role_id", "role_name")
    .select("-password")
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: users,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getAllUsersPaginated = async (page = 1, limit = 10, search = "", status = "") => {
  const query = { is_deleted: { $ne: true } };
  if (search) {
    const safe = escapeRegex(search);
    query.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
  }
  if (status) query.status = status;
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .populate("organization_id", "name email")
    .populate("role_id", "role_name")
    .select("-password")
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: users,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getAllRolesPaginated = async (page = 1, limit = 10) => {
  const total = await Role.countDocuments();
  const roles = await Role.find()
    .sort({ role_name: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: roles,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getPendingOrgsPaginated = async (page = 1, limit = 10) => {
  const query = { approval_status: "pending", is_deleted: { $ne: true } };
  const total = await Organization.countDocuments(query);
  const orgs = await Organization.find(query)
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: orgs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getAuditLogsPaginated = async (page = 1, limit = 20, filters = {}) => {
  const query = {};
  if (filters.userId) query.user_id = filters.userId;
  if (filters.action) query.action = { $regex: escapeRegex(filters.action), $options: "i" };
  if (filters.tableName) query.table_name = filters.tableName;
  if (filters.from || filters.to) {
    query.created_at = {};
    if (filters.from) query.created_at.$gte = new Date(filters.from);
    if (filters.to) query.created_at.$lte = new Date(filters.to);
  }
  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .populate("user_id", "name email")
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: logs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};
