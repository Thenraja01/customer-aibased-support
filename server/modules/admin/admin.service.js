import User from "../user/user.schema.js";
import Organization from "../organization/organization.schema.js";
import Role from "../role/role.schema.js";
import AuditLog from "../audit-log/auditLog.schema.js";
import { escapeRegex } from "../../utils/escapeRegex.js";

export const getDashboardStats = async () => {
  const [totalUsers, totalOrgs, totalRoles, recentLogs, blockedUsers, activeUsers] =
    await Promise.all([
      User.countDocuments(),
      Organization.countDocuments(),
      Role.countDocuments(),
      AuditLog.countDocuments(),
      User.countDocuments({ status: "blocked" }),
      User.countDocuments({ status: "active" }),
    ]);

  const orgs = await Organization.find()
    .select("name organization_id")
    .lean();

  const orgUserCounts = await User.aggregate([
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
  const query = { organization_id: orgId };
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
  const query = {};
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
