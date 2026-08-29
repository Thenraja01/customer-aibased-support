// middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import env from "../config/env.js";
import User from "../modules/user/user.schema.js";
import Organization from "../modules/organization/organization.schema.js";
import {
  getEffectivePermissions,
  getRoleNames,
  getRolesWithIds,
} from "../modules/user-role/userRole.service.js";
import { getCache } from "../config/redis.js";
import { hasAllPermissions, hasPermission, WILDCARD } from "../utils/permissions.js";
import { normalizeRoleName } from "../utils/constants.js";
import { verifyAccessToken } from "../modules/auth/token.service.js";

const USER_CACHE_TTL_MS = 60 * 1000; 
export const invalidateUserCache = async (userId) => {
  const cache = getCache();
  await cache.del(`user:${userId}`);
};

const loadCachedUser = async (userId) => {
  const cache = getCache();
  try {
    const raw = await cache.get(`user:${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to DB */
  }
  return null;
};

const storeCachedUser = async (user) => {
  const cache = getCache();
  await cache.set(`user:${user.userId}`, JSON.stringify(user), USER_CACHE_TTL_MS);
};

const loadUser = async (userId) => {
  const cached = await loadCachedUser(userId);
  if (cached) return cached;

  const user = await User.findById(userId).lean();
  if (!user) return null;

  const org = user.organization_id
    ? await Organization.findById(user.organization_id).select("status name").lean()
    : null;

  const roles = await getRoleNames(user._id, user.organization_id);
  const rolesWithIds = await getRolesWithIds(user._id, user.organization_id);
  const permissions = await getEffectivePermissions(user._id, user.organization_id);

  const built = {
    userId: user._id.toString(),
    _id: user._id,
    name: user.name,
    email: user.email,
    status: user.status,
    auth_type: user.auth_type,
    organization_id: user.organization_id?.toString() || null,
    organizationId: user.organization_id?.toString() || null,
    organizationStatus: org?.status || null,
    organizationName: org?.name || null,
    roles,
    roleIds: rolesWithIds.map((r) => r.roleId),
    roleName: roles[0] || null,
    roleId: rolesWithIds[0]?.roleId || null,
    permissions,
    oauth: user.oauth || null,
    email_verified: user.email_verified,
  };

  await storeCachedUser(built);
  return built;
};

/**
 * Protect middleware — validates the access JWT and attaches the full
 * user context (roles, permissions, organization) to `req.user`.
 */
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query?.token) {
    token = String(req.query.token);
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: No token provided" });
  }

  token = token.replace(/^["']|["']$/g, "").trim();

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Unauthorized: Token has expired"
        : error.name === "JsonWebTokenError"
        ? "Unauthorized: Invalid token"
        : "Unauthorized: Authentication failed";
    return res.status(401).json({ success: false, message });
  }

  let user;
  try {
    user = await loadUser(decoded.userId);
  } catch (error) {
    // Internal error during user/role loading — must NOT be surfaced as an
    // auth failure (that would trigger token-refresh on the client and mask
    // a real server problem). Log it and return 500 instead.
    console.error(`[protect] Failed to load user ${decoded.userId}:`, error);
    return res.status(500).json({ success: false, message: "Internal error while authenticating" });
  }

  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
  }

    // Cross-check: the JWT organization must match the live user's organization (unless super_admin).
    const isSuperAdminUser = (user.roles || []).includes("super_admin") || user.roleName === "super_admin";
    if (
      !isSuperAdminUser &&
      decoded.organizationId &&
      user.organizationId &&
      decoded.organizationId.toString() !== user.organizationId.toString()
    ) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token organization mismatch" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ success: false, message: "Forbidden: Account is not active" });
    }

    if (user.organizationStatus && user.organizationStatus !== "active") {
      return res.status(403).json({ success: false, message: "Forbidden: Organization is not active" });
    }

    req.user = { ...user, tokenData: decoded };
    req.token = token;
    next();
};

/**
 * Token auth for browser-safe file viewing.
 * The document `file_url` embeds `?token=<accessToken>` so the file can be
 * opened directly (new tab / iframe) without an Authorization header.
 * If a valid token is present in the query string, it is used in place of the
 * header. All authorization/tenant checks in `protect` still apply.
 */
export const protectFromQueryToken = async (req, res, next) => {
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  return protect(req, res, next);
};

/**
 * Simple protect — verifies the JWT only, no DB lookup.
 * For lightweight checks where full context is not needed.
 */
export const protectSimple = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = verifyAccessToken(authHeader.split(" ")[1]);
    req.user = {
      ...decoded,
      userId: decoded.userId,
      roles: decoded.roles || [],
      roleName: decoded.roles?.[0] || null,
      organizationId: decoded.organizationId,
      permissions: [],
    };
    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Unauthorized: Token has expired"
        : "Unauthorized: Invalid token";
    return res.status(401).json({ success: false, message });
  }
};

/**
 * Role-based gate (legacy/UX aid). Prefer `permission()` for authorization.
 * A user passes if they hold ANY of the allowed roles.
 */
export const restrict = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
    }
    const userRoles = req.user.roles || [];
    const normalize = (s) => (s || "").toLowerCase().trim().replace(/[\s_]+/g, "");
    const isAllowed = allowedRoles.some((role) =>
      userRoles.some((ur) => normalize(ur) === normalize(role))
    );
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Required roles: ${allowedRoles.join(", ")}. Your roles: ${userRoles.join(", ") || "none"}`,
      });
    }
    next();
  };
};

/**
 * Permission-based gate — the PRIMARY authorization mechanism.
 * A user must hold ALL listed permissions (or the super-admin wildcard).
 */
export const requirePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
    }
    const userPermissions = req.user.permissions || [];
    if (!hasAllPermissions(userPermissions, requiredPermissions)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permissions. Required: ${requiredPermissions.join(", ")}`,
      });
    }
    next();
  };
};

export const selfOrAdmin = (req, res, next) => {
  const paramId = req.params.id || req.params.userId;
  const userId = req.user?.userId;
  const isAdmin = hasPermission(req.user?.permissions, WILDCARD) ||
    hasPermission(req.user?.permissions, "user.view");

  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
  }
  if (isAdmin) return next();
  if (paramId && paramId.toString() === userId?.toString()) return next();
  return res.status(403).json({ success: false, message: "Forbidden: You can only access your own data" });
};

export const selfOrAdminParam = (paramName = "id") => {
  return (req, res, next) => {
    const paramId = req.params[paramName];
    const userId = req.user?.userId;
    const isAdmin = hasPermission(req.user?.permissions, WILDCARD) ||
      hasPermission(req.user?.permissions, "user.view");
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
    }
    if (isAdmin) return next();
    if (paramId && paramId.toString() === userId?.toString()) return next();
    return res.status(403).json({ success: false, message: "Forbidden: You can only access your own data" });
  };
};

export const ownerOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      const isAdmin = hasPermission(req.user?.permissions, WILDCARD) ||
        hasPermission(req.user?.permissions, "user.view");
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
      }
      if (isAdmin) return next();
      const ownerId = getResourceOwnerId(req);
      if (ownerId && ownerId.toString() === userId?.toString()) return next();
      return res.status(403).json({ success: false, message: "Forbidden: You do not own this resource" });
    } catch {
      return res.status(500).json({ success: false, message: "Authorization failed" });
    }
  };
};

export const selfOrAdminByChatOwner = (paramName = "chatId") => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
    }

    const chatId = req.params[paramName];
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const rawOrgId = req.scope?.organizationId || req.user?.organizationId || req.user?.organization_id;
    const userOrgId = typeof rawOrgId === "object" && rawOrgId?._id ? rawOrgId._id : rawOrgId;
    const roleName = req.user?.roleName || req.user?.role || (typeof req.user?.role_id === "object" ? req.user?.role_id?.name || req.user?.role_id?.role_name : req.user?.role_id);
    const normalizedRole = normalizeRoleName(roleName);

    const isStaffOrAdmin = ["super_admin", "admin", "branch_admin", "support"].includes(normalizedRole) ||
      hasPermission(req.user?.permissions, WILDCARD) ||
      hasPermission(req.user?.permissions, "user.view");

    try {
      const Chat = mongoose.model("Chat");
      const chat = await Chat.findById(chatId).select("user_id customer_id organization_id").lean();
      if (!chat) {
        return res.status(404).json({ success: false, message: "Chat session not found" });
      }

      // 1. Cross-tenant check for non-superadmin
      if (normalizedRole !== "super_admin" && chat.organization_id && userOrgId && chat.organization_id.toString() !== userOrgId.toString()) {
        return res.status(403).json({ success: false, message: "Forbidden: Cross-tenant access denied" });
      }

      // 2. Staff and Admins within the organization can view any chat in their org
      if (isStaffOrAdmin) {
        return next();
      }

      // 3. Customers can view their own chat
      const chatOwnerId = chat.user_id || chat.customer_id;
      if (chatOwnerId && chatOwnerId.toString() === userId?.toString()) {
        return next();
      }
    } catch {
      /* fall through */
    }
    return res.status(403).json({ success: false, message: "Forbidden: You can only access your own conversations" });
  };
};

export default {
  protect,
  protectSimple,
  restrict,
  requirePermissions,
  selfOrAdmin,
  selfOrAdminParam,
  ownerOrAdmin,
  selfOrAdminByChatOwner,
  invalidateUserCache,
};
