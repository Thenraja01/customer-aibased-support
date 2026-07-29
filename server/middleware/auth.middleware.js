// middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import env from "../config/env.js";
import { getCache } from "../config/redis.js";
import User from "../modules/user/user.schema.js";
import { normalizeRoleName, isNormalizedAdminRole } from "../utils/constants.js";

/**
 * Invalidate cached data for a user (permissions, sessions, etc.).
 * Called after user state changes (OAuth login, role updates, etc.).
 */
export const invalidateUserCache = async (userId) => {
  try {
    const cache = getCache();
    const pattern = `perm:${userId}:`;
    const keys = await cache.keys(`${pattern}*`);
    for (const key of keys) {
      await cache.del(key);
    }
  } catch (error) {
    console.error("[invalidateUserCache] Failed to clear cache:", error.message);
  }
};

/**
 * Protect middleware - Verifies JWT token and attaches user to request
 * Enhanced version that fetches full user data from database
 */
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);
    console.log(`✅ Token verified for user: ${decoded.email}`);

    // Fetch full user data from database with populated role
    const user = await User.findById(decoded.userId)
      .populate("organization_id")
      .populate("role_id")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    // Check if user is active
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Account is not active",
      });
    }

    // Attach full user and token data to request
    req.user = {
      ...user,
      userId: user._id,
      organizationId: user.organization_id?._id || user.organization_id,
      roleId: decoded.roleId || user.role_id?._id,
      role: user.role || user.role_id?.role_name,
      tokenData: decoded
    };
    
    req.token = token;
    next();
  } catch (error) {
    console.error("❌ Auth error:", error.message);
    
    const message =
      error.name === "TokenExpiredError"
        ? "Unauthorized: Token has expired"
        : error.name === "JsonWebTokenError"
        ? "Unauthorized: Invalid token"
        : "Unauthorized: Authentication failed";

    return res.status(401).json({ success: false, message });
  }
};

/**
 * Self or Admin access control
 * Allows users to access their own resources, admins can access all
 */
export const selfOrAdmin = (req, res, next) => {
  const paramId = req.params.id || req.params.userId;
  const userId = req.user?.userId || req.user?._id;
  const userRole = req.user?.role || req.user?.roleName || req.user?.role_id?.role_name;
  const isAdmin = isNormalizedAdminRole(normalizeRoleName(userRole));

  // If no user, return unauthorized
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: User not authenticated"
    });
  }

  // Admin can access any resource
  if (isAdmin) {
    return next();
  }

  // Check if user is accessing their own resource
  if (paramId && paramId.toString() === userId.toString()) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Forbidden: You can only access your own data",
  });
};

/**
 * Self or Admin with custom parameter name
 * @param {string} paramName - Name of the parameter to check
 */
export const selfOrAdminParam = (paramName = 'id') => {
  return (req, res, next) => {
    const paramId = req.params[paramName];
    const userId = req.user?.userId || req.user?._id;
    const userRole = req.user?.role || req.user?.roleName || req.user?.role_id?.role_name;
    const isAdmin = isNormalizedAdminRole(normalizeRoleName(userRole));

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated"
      });
    }

    if (isAdmin) {
      return next();
    }

    if (paramId && paramId.toString() === userId.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Forbidden: You can only access your own data",
    });
  };
};

/**
 * Self or Admin by chat ownership
 * Allows chat owners and admins to access chat resources
 * @param {string} paramName - Name of the chatId parameter (default: 'chatId')
 */
export const selfOrAdminByChatOwner = (paramName = 'chatId') => {
  return async (req, res, next) => {
    const chatId = req.params[paramName];
    const userId = req.user?.userId || req.user?._id;
    const userRole = req.user?.role || req.user?.roleName || req.user?.role_id?.role_name;
    const isAdmin = isNormalizedAdminRole(normalizeRoleName(userRole));

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated"
      });
    }

    if (isAdmin) {
      return next();
    }

    try {
      const Chat = mongoose.model('Chat');
      const chat = await Chat.findById(chatId).select('user_id').lean();
      if (chat && chat.user_id?.toString() === userId.toString()) {
        return next();
      }
    } catch {
      // fall through to forbidden
    }

    return res.status(403).json({
      success: false,
      message: "Forbidden: You can only access your own conversations",
    });
  };
};

export default {
  protect,
  selfOrAdmin,
  selfOrAdminParam,
  selfOrAdminByChatOwner,
  invalidateUserCache,
};