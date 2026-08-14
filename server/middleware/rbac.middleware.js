// middleware/rbac.middleware.js
//
// Minimal, role-first RBAC helpers used for route protection:
//
//   authenticate()      → verify JWT (protect) and attach req.user
//   checkRole("ADMIN")  → role-based gate for pages / modules / routes
//   checkOrganization() → multi-tenant isolation
//   checkOwnership()    → ownership validation for customer resources
//
// Super Admin is treated as a special role and always passes every gate.

import { normalizeRoleName, isSuperAdmin, isNormalizedAdminRole } from "../utils/constants.js";
import User from "../modules/user/user.schema.js";

/**
 * Check that the authenticated user holds at least one of the given roles.
 * Role names are normalized (case-insensitive, spaces/underscores ignored).
 *
 * @param {...string} allowedRoles e.g. checkRole("super_admin", "admin")
 */
export const checkRole = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(normalizeRoleName).filter(Boolean);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    const userRole =
      req.user.roleName || req.user.role || req.user.role_id?.role_name;

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: No role assigned to user",
      });
    }

    // Super admin always passes regardless of the allowed list.
    if (isSuperAdmin(userRole)) {
      return next();
    }

    const normalizedUserRole = normalizeRoleName(userRole);

    if (normalizedAllowed.includes(normalizedUserRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: Requires one of roles: ${normalizedAllowed.join(", ")}. Your role: ${userRole}`,
    });
  };
};

/**
 * Ensure the authenticated user belongs to the same organization as the
 * resource they are trying to access. Super admins bypass tenant isolation.
 *
 * Accepts a function to resolve the resource's organization id from the
 * request (defaults to `req.params.organizationId`).
 *
 * @param {(req) => string|null} resolveOrgId
 */
export const checkOrganization = (resolveOrgId = (req) => req.params?.organizationId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    const userRole =
      req.user.roleName || req.user.role || req.user.role_id?.role_name;

    if (isSuperAdmin(userRole)) {
      return next();
    }

    const targetOrgId = resolveOrgId(req);
    const userOrgId =
      req.user.organizationId || req.user.organization_id?._id || req.user.organization_id;

    if (!userOrgId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: User has no organization assigned",
      });
    }

    if (targetOrgId && targetOrgId.toString() !== userOrgId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Cannot access resources of another organization",
      });
    }

    next();
  };
};

/**
 * Ownership validation — separate from roles. Ensures a customer can only
 * access their own resources. Admins and support agents bypass the check.
 *
 * @param {Object} options
 * @param {string} options.model       Mongoose model name to query
 * @param {string} [options.idParam]   Route param holding the resource id (default "id")
 * @param {string} [options.ownerField] Field on the model holding the owner user id (default "user_id")
 */
export const checkOwnership = ({ model, idParam = "id", ownerField = "user_id" } = {}) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    const userRole =
      req.user.roleName || req.user.role || req.user.role_id?.role_name;

    // Admins, branch admins and super admins manage resources across users.
    if (["super_admin", "admin", "branch_admin", "support"].includes(normalizeRoleName(userRole))) {
      return next();
    }

    const resourceId = req.params?.[idParam];
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: `Missing resource id (${idParam})`,
      });
    }

    if (!model) {
      return res.status(500).json({
        success: false,
        message: "Ownership middleware not configured with a model",
      });
    }

    try {
      const userId = req.user.userId || req.user._id;
      const resource = await model.findById(resourceId).select(ownerField).lean();

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: "Resource not found",
        });
      }

      const ownerId = resource[ownerField];
      if (ownerId && ownerId.toString() === userId.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only access your own resources",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
};

/**
 * Validate that a user id param matches the authenticated user OR the user is
 * an admin. Used for profile / self-service endpoints.
 *
 * @param {string} [idParam] Route param holding the target user id (default "userId")
 */
export const selfOrAdmin = (idParam = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    const userRole =
      req.user.roleName || req.user.role || req.user.role_id?.role_name;

    if (["super_admin", "admin", "branch_admin", "support"].includes(normalizeRoleName(userRole))) {
      return next();
    }

    const targetId = req.params?.[idParam];
    const userId = req.user.userId || req.user._id;

    if (targetId && targetId.toString() === userId.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Forbidden: You can only access your own data",
    });
  };
};

export default {
  checkRole,
  checkOrganization,
  checkOwnership,
  selfOrAdmin,
};
