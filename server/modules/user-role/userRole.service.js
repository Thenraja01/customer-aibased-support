import UserRole from "./userRole.schema.js";
import Role from "../role/role.schema.js";
import { getCache } from "../../config/redis.js";
import { WILDCARD } from "../../utils/permissions.js";


const PERM_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const getUserRoles = async (userId, organizationId = null) => {
  const filter = { user_id: userId };
  if (organizationId) filter.organization_id = organizationId;
  return UserRole.find(filter).populate("role_id", "role_name permissions status").lean();
};

/**
 * Union of permissions across every active role a user holds in an org.
 *
 * Single source of truth: the `role.permissions` array on the Role document
 * (the centralized permission registry in `utils/permissions.js` governs what
 * keys may live there). Cached in Redis (key: `perm:{userId}:{orgId}`) with
 * DB fallback. No other source (role-name heuristics, join tables, etc.) is
 * consulted.
 */
export const getEffectivePermissions = async (userId, organizationId) => {
  const cache = getCache();
  const cacheKey = `perm:${userId}:${organizationId}`;

  try {
    const cached = await cache.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    /* fall through to DB */
  }

  const userRoles = await getUserRoles(userId, organizationId);
  const permissionSet = new Set();
  let isSuperAdmin = false;

  for (const ur of userRoles) {
    const role = ur.role_id;
    if (!role || role.status !== "active") continue;

    // Canonical: role.permissions array (config-driven, normalized on write).
    if (Array.isArray(role.permissions)) {
      if (role.permissions.includes(WILDCARD)) isSuperAdmin = true;
      role.permissions.forEach((p) => permissionSet.add(p));
    }
  }

  const permissions = [...permissionSet];
  if (isSuperAdmin) permissions.push(WILDCARD);

  await cache.set(cacheKey, JSON.stringify(permissions), PERM_CACHE_TTL_MS);
  return permissions;
};

export const invalidatePermissionCache = async (userId, organizationId) => {
  const cache = getCache();
  if (organizationId) {
    await cache.del(`perm:${userId}:${organizationId}`);
  } else {
    const keys = await cache.keys(`perm:${userId}:*`);
    for (const key of keys) await cache.del(key);
  }
};

/**
 * Validate that a role may be assigned within a tenant. Rejects:
 *  - non-existent / inactive roles
 *  - roles owned by a *different* organization
 *  - any role carrying the super-admin wildcard (`*`)
 *
 * Used at every untrusted assignment boundary (user-role API, user create/edit,
 * registration approval) to prevent tenant admins from escalating to
 * Super Admin by crafting a role _id.
 */
export const resolveAssignableRole = async (roleId, organizationId = null) => {
  const role = await Role.findById(roleId);
  if (!role) throw new Error("Role not found");
  if (role.status !== "active") throw new Error("Role is not active");
  if (
    organizationId &&
    role.organization_id &&
    role.organization_id.toString() !== organizationId.toString()
  ) {
    throw new Error("Role not found in this organization");
  }
  if (Array.isArray(role.permissions) && role.permissions.includes(WILDCARD)) {
    throw new Error("Cannot assign super admin role");
  }
  return role;
};

export const assignRole = async ({
  userId,
  roleId,
  organizationId,
  assignedBy = null,
}) => {
  const role = await Role.findById(roleId);
  if (!role) throw new Error("Role not found");

  const existing = await UserRole.findOne({ user_id: userId, role_id: roleId, organization_id: organizationId });
  if (existing) return existing;

  const userRole = await UserRole.create({
    user_id: userId,
    role_id: roleId,
    organization_id: organizationId,
    assigned_by: assignedBy,
  });

  await invalidatePermissionCache(userId, organizationId);
  return userRole;
};

export const removeRole = async ({ userId, roleId, organizationId }) => {
  const result = await UserRole.deleteOne({
    user_id: userId,
    role_id: roleId,
    organization_id: organizationId,
  });
  await invalidatePermissionCache(userId, organizationId);
  return result;
};

export const listUserRolesForUser = async (userId) =>
  UserRole.find({ user_id: userId })
    .populate("role_id", "role_name description status permissions")
    .populate("organization_id", "name")
    .lean();

export const attachRolesToUsers = async (users) => {
  const list = Array.isArray(users) ? users : [users];
  const ids = list.filter(Boolean).map((u) => u._id);
  if (ids.length === 0) return list;

  const userRoles = await UserRole.find({ user_id: { $in: ids } })
    .populate("role_id", "role_name description status permissions")
    .lean();

  const map = new Map();
  for (const ur of userRoles) {
    if (!ur.role_id) continue;
    const key = ur.user_id.toString();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(ur.role_id);
  }

  for (const user of list) {
    if (!user) continue;
    const roles = map.get(user._id.toString()) || [];
    user.roles = roles;
    user.role_id = roles[0]?._id || null;
    user.roleName = roles[0]?.role_name || null;
  }
  return list;
};

export const getRoleNames = async (userId, organizationId) => {
  const User = (await import("../user/user.schema.js")).default;
  const user = await User.findById(userId).lean();
  if (user && user.role) {
    return [user.role];
  }
  return [];
};

/** Role names + role _ids for a user in an organization. */
export const getRolesWithIds = async (userId, organizationId) => {
  const User = (await import("../user/user.schema.js")).default;
  const user = await User.findById(userId).lean();
  if (user && user.role) {
    return [{ roleName: user.role, roleId: user.role }];
  }
  return [];
};

/**
 * Users inside an organization whose effective permissions include the given
 * permission (or the super-admin wildcard). Used to notify the right people
 * (e.g. admins about pending registrations).
 */
export const getUsersWithPermission = async (organizationId, requiredPermission) => {
  const userRoles = await UserRole.find({ organization_id: organizationId })
    .populate("role_id", "permissions status")
    .populate("user_id", "_id name email status")
    .lean();

  const seen = new Set();
  const users = [];
  for (const ur of userRoles) {
    const role = ur.role_id;
    const user = ur.user_id;
    if (!role || !user || role.status !== "active" || user.status !== "active") continue;
    if (seen.has(user._id.toString())) continue;
    const perms = role.permissions || [];
    if (perms.includes(WILDCARD) || perms.includes(requiredPermission)) {
      seen.add(user._id.toString());
      users.push(user);
    }
  }
  return users;
};

export default {
  getUserRoles,
  getEffectivePermissions,
  invalidatePermissionCache,
  assignRole,
  removeRole,
  resolveAssignableRole,
  listUserRolesForUser,
  getRoleNames,
  getRolesWithIds,
  getUsersWithPermission,
  attachRolesToUsers,
};
