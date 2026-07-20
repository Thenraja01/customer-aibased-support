import User from "./user.schema.js";
import Organization from "../organization/organization.schema.js";
import Role from "../role/role.schema.js";
import bcrypt from "bcrypt";
import { escapeRegex } from "../../utils/escapeRegex.js";

export const getAllUsers = async (options = {}, organizationId = null) => {
  const { page, limit, status, role, search, sortBy, sortOrder } = options;
  const filter = { is_deleted: { $ne: true } };
  if (organizationId) filter.organization_id = organizationId;
  if (status) filter.status = status;
  if (role) filter.role_id = role;
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
  }

  const sortField = sortBy || "created_at";
  const sortDir = sortOrder === "asc" ? 1 : -1;
  const sortObj = {};
  sortObj[sortField] = sortDir;

  if (page && limit) {
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate("organization_id", "name email")
      .populate("role_id", "role_name")
      .select("-password")
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return {
      data: users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  return await User.find(filter)
    .populate("organization_id", "name email")
    .populate("role_id", "role_name")
    .select("-password")
    .sort(sortObj);
};

export const getUserById = async (id, organizationId = null) => {
  const filter = { _id: id, is_deleted: { $ne: true } };
  if (organizationId) filter.organization_id = organizationId;
  const user = await User.findOne(filter)
    .populate("organization_id", "name email")
    .populate("role_id", "role_name")
    .select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

export const createUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email, is_deleted: { $ne: true } });
  if (existingUser) throw new Error("Email already exists");

  const organization = await Organization.findById(userData.organization_id);
  if (!organization) throw new Error("Organization not found");

  const role = await Role.findById(userData.role_id);
  if (!role) throw new Error("Role not found");

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user = await User.create({ ...userData, password: hashedPassword });

  const { password: _, ...safeUser } = user.toObject();
  return safeUser;
};

export const updateUser = async (id, userData, organizationId = null) => {
  delete userData.password;
  delete userData.role_id;

  const filter = { _id: id };
  if (organizationId) filter.organization_id = organizationId;

  const user = await User.findOneAndUpdate(filter, userData, {
    new: true,
    runValidators: true,
  })
    .populate("organization_id", "name email")
    .populate("role_id", "role_name")
    .select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

export const updateUserStatus = async (id, status, organizationId = null) => {
  const allowed = ["active", "inactive", "blocked", "pending"];
  if (!allowed.includes(status)) throw new Error("Invalid status value");

  const filter = { _id: id };
  if (organizationId) filter.organization_id = organizationId;

  const user = await User.findOneAndUpdate(filter, { status }, { new: true }).select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

export const deleteUser = async (id, organizationId = null) => {
  const filter = { _id: id };
  if (organizationId) filter.organization_id = organizationId;

  const user = await User.findOneAndUpdate(
    filter,
    { is_deleted: true, deleted_at: new Date() },
    { new: true }
  );
  if (!user) throw new Error("User not found");
  return { message: "User soft-deleted" };
};

export const hardDeleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error("User not found");
  return { message: "User permanently deleted" };
};

export const searchUsers = async (keyword, organizationId = null) => {
  const safe = escapeRegex(keyword);
  const filter = {
    is_deleted: { $ne: true },
    $or: [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ],
  };
  if (organizationId) filter.organization_id = organizationId;

  return await User.find(filter)
    .populate("organization_id", "name")
    .populate("role_id", "role_name")
    .select("-password");
};

export const updateProfile = async (userId, profileData) => {
  const user = await User.findByIdAndUpdate(userId, profileData, {
    new: true,
    runValidators: true,
  })
    .populate("organization_id", "name email")
    .populate("role_id", "role_name")
    .select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) throw new Error("Current password is incorrect");

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (!isSamePassword) throw new Error("New password cannot be the same as current password");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return { message: "Password changed successfully" };
};

export const uploadAvatar = async (userId, file) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { avatar_url: `/uploads/avatars/${file.filename || file.originalname}` },
    { new: true }
  ).select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

export const getActivityLogs = async (userId) => {
  const { default: AuditLog } = await import("../audit-log/auditLog.schema.js");
  return await AuditLog.find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(50)
    .lean();
};
