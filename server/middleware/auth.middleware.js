// middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../modules/user/user.schema.js";

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
      roleName: user.role_id?.role_name,
      permissions: user.role_id?.permissions || [],
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
 * Simple protect middleware - Only verifies token without DB lookup
 * Use for lightweight auth checks
 */
export const protectSimple = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    req.user.userId = decoded.userId;
    req.user.roleName = decoded.roleName;
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
 * Restrict middleware - Role-based access control
 * @param {...string} allowedRoles - List of roles allowed to access
 */
export const restrict = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated"
      });
    }

    const userRole = req.user.roleName || req.user.role_id?.role_name;
    
    console.log(`🔐 Restrict check: User role: ${userRole}, Allowed: ${allowedRoles.join(', ')}`);

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: No role assigned to user",
      });
    }

    // Case-insensitive comparison
    const normalizedUserRole = userRole.toLowerCase().trim();
    const isAllowed = allowedRoles.some(role =>
      role.toLowerCase().trim() === normalizedUserRole
    );

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`,
      });
    }

    next();
  };
};

/**
 * Permission-based authorization
 * @param {...string} requiredPermissions - List of permissions required
 */
export const requirePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated"
      });
    }

    const userPermissions = req.user.permissions || req.user.role_id?.permissions || [];
    
    console.log(`🔐 Permission check: Required: ${requiredPermissions.join(', ')}`);
    console.log(`   User permissions: ${userPermissions.join(', ')}`);

    // Super admin has all permissions (wildcard)
    if (userPermissions.includes('*')) {
      console.log('✅ Super admin with wildcard permissions');
      return next();
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permissions. Required: ${requiredPermissions.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Self or Admin access control
 * Allows users to access their own resources, admins can access all
 */
export const selfOrAdmin = (req, res, next) => {
  const paramId = req.params.id || req.params.userId;
  const userId = req.user?.userId || req.user?._id;
  const userRole = req.user?.roleName || req.user?.role_id?.role_name;
  const isAdmin = ['super admin', 'tenant admin', 'admin'].includes(
    userRole?.toLowerCase()
  );

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
    const userRole = req.user?.roleName || req.user?.role_id?.role_name;
    const isAdmin = ['super admin', 'tenant admin', 'admin'].includes(
      userRole?.toLowerCase()
    );

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
 * Check if user owns the resource
 * @param {Function} getResourceOwnerId - Function to get owner ID from request
 */
export const ownerOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?._id;
      const userRole = req.user?.roleName || req.user?.role_id?.role_name;
      const isAdmin = ['super admin', 'tenant admin', 'admin'].includes(
        userRole?.toLowerCase()
      );

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

      // Get the owner ID from the request
      const ownerId = getResourceOwnerId(req);
      
      // Check if user is the owner
      if (ownerId && ownerId.toString() === userId.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not own this resource",
      });
    } catch (error) {
      console.error("❌ Owner/Admin check error:", error);
      return res.status(500).json({
        success: false,
        message: "Authorization failed",
      });
    }
  };
};

export default {
  protect,
  protectSimple,
  restrict,
  requirePermissions,
  selfOrAdmin,
  selfOrAdminParam,
  ownerOrAdmin
};