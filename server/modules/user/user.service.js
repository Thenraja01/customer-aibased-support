import User from "./user.schema.js";
import Organization from "../organization/organization.schema.js";
import Role from "../role/role.schema.js";
import bcrypt from "bcrypt";
import { escapeRegex } from "../../utils/escapeRegex.js";

export const getAllUsers = async (organizationId = null) => {
  const filter = {};
  if (organizationId) filter.organization_id = organizationId;
  return await User.find(filter)
    .populate("organization_id", "name email")
    .populate("role_id", "role_name")
    .select("-password");
};

export const getUserById = async (id) => {
  const user = await User.findById(id)
    .populate("organization_id", "name email")
    .populate("role_id", "role_name")
    .select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

export const createUser = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email });
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

export const updateUser = async (id, userData) => {
  delete userData.password;
  delete userData.role_id;
  const user = await User.findByIdAndUpdate(id, userData, {
    new: true,
    runValidators: true,
  })
    .populate("organization_id", "name email")
    .populate("role_id", "role_name")
    .select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

export const updateUserStatus = async (id, status) => {
  const allowed = ["active", "inactive", "blocked", "pending", "approved"];
  if (!allowed.includes(status)) throw new Error("Invalid status value");
  const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select(
    "-password"
  );
  if (!user) throw new Error("User not found");
  return user;
};

export const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error("User not found");
  return { message: "User deleted successfully" };
};

export const searchUsers = async (keyword) => {
  const safe = escapeRegex(keyword);
  return await User.find({
    $or: [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ],
  })
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
  if (isSamePassword) throw new Error("New password cannot be the same as current password");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return { message: "Password changed successfully" };
};

/**
 * Save (or replace) the FCM device token for a user.
 * The frontend should call POST /users/fcm-token after receiving a token
 * from the FCM SDK. Overwrites any previously stored token for the user
 * (single-device model). For multi-device support, switch fcm_token to
 * an array field and use $addToSet here instead.
 *
 * @param {string} userId - MongoDB ObjectId string of the user
 * @param {string} token  - FCM registration token from the client
 */
export const saveFcmToken = async (userId, token) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { fcm_token: token },
    { new: true }
  ).select("_id fcm_token");
  if (!user) throw new Error("User not found");
  return user;
};

/**
 * Clear the FCM token from the user document.
 * Called in two situations:
 *   1. Explicitly by the user (e.g. on logout via DELETE /users/fcm-token)
 *   2. Automatically by firebase.js when FCM reports the token as stale
 *
 * @param {string} userId - MongoDB ObjectId string of the user
 */
export const clearFcmToken = async (userId) => {
  await User.findByIdAndUpdate(userId, { $unset: { fcm_token: "" } });
  return { message: "FCM token cleared" };
};

