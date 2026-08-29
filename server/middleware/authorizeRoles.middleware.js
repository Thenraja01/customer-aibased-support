// middleware/authorizeRoles.middleware.js
import { normalizeRoleName } from "../utils/constants.js";

/**
 * Role-based authorization middleware
 * @param {...string} allowedRoles - List of roles allowed to access the route
 * @returns {Function} Express middleware
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated"
      });
    }

    const userRole = req.user.role || req.user.roleName || req.user.roleName;
    
    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: No role assigned to user"
      });
    }

    // Normalize roles for comparison
    const normalize = (s) => s.toLowerCase().trim().replace(/[\s_]+/g, "");
    const normalizedUserRole = normalize(userRole);
    const isAllowed = allowedRoles.some(role =>
      normalize(role) === normalizedUserRole
    );

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Required roles: ${allowedRoles.join(", ")}. Your role: ${userRole}`,
      });
    }

    next();
  };
};

/**
 * Check if user has any of the specified roles
 * @param {...string} roles - Roles to check
 * @returns {Function} Express middleware
 */
export const hasAnyRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated"
      });
    }

    const userRole = req.user.role || req.user.roleName || req.user.roleName;
    
    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: No role assigned to user"
      });
    }

    const normalize = (s) => s.toLowerCase().trim().replace(/[\s_]+/g, "");
    const normalizedUserRole = normalize(userRole);
    const hasRole = roles.some(role => normalize(role) === normalizedUserRole);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Required one of roles: ${roles.join(", ")}. Your role: ${userRole}`,
      });
    }

    next();
  };
};

export default {
  authorizeRoles,
  hasAnyRole,
};