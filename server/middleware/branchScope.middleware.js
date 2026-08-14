// middleware/branchScope.middleware.js
//
// Enforces branch-level tenant isolation.
//
// Security rule:
//   organizationId === currentUser.organizationId
//   AND (for branch resources)
//   branchId === currentUser.branchId  (unless org_admin or super_admin)
//
// Scope lattice:
//   SUPER_ADMIN  → global
//   ORG_ADMIN    → organization
//   BRANCH_ADMIN → organization + branch
//   SUPPORT      → organization + branch
//   CUSTOMER     → organization + branch + customer

import { normalizeRoleName, isSuperAdmin } from "../utils/constants.js";

/**
 * Enforce that the request's target organization matches the user's org.
 * Super admins bypass this check.
 *
 * @param {(req) => string|null} resolveOrgId  Extracts the target org id from the request.
 */
export const enforceOrgScope = (resolveOrgId) => {
  const resolve = resolveOrgId || ((req) =>
    req.body?.organization_id || req.params?.organizationId || req.query?.organizationId
  );

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userRole = req.user.roleName || req.user.role;
    if (isSuperAdmin(userRole)) return next();

    const userOrgId = req.user.organizationId?.toString();
    const targetOrgId = resolve(req)?.toString();

    if (!userOrgId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: User has no organization assigned",
      });
    }

    // If a target org is specified, it must match the user's org
    if (targetOrgId && targetOrgId !== userOrgId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Cannot access resources of another organization",
      });
    }

    next();
  };
};

/**
 * Enforce that the request's target branch matches the user's branch.
 * Super admins and org admins bypass the branch check.
 * Org admins still have the org check enforced.
 *
 * @param {(req) => string|null} resolveBranchId  Extracts the target branch id.
 * @param {(req) => string|null} resolveOrgId     Extracts the target org id.
 */
export const enforceBranchScope = (resolveBranchId, resolveOrgId) => {
  const resolveBranch = resolveBranchId || ((req) =>
    req.body?.branch_id || req.params?.branchId || req.query?.branchId
  );

  const resolveOrg = resolveOrgId || ((req) =>
    req.body?.organization_id || req.params?.organizationId || req.query?.organizationId
  );

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userRole = normalizeRoleName(req.user.roleName || req.user.role);

    // Super admin: global scope — bypass everything
    if (isSuperAdmin(userRole)) return next();

    const userOrgId = req.user.organizationId?.toString();
    const targetOrgId = resolveOrg(req)?.toString();

    if (!userOrgId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: User has no organization assigned",
      });
    }

    // Organization check (applies to all non-super roles)
    if (targetOrgId && targetOrgId !== userOrgId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Cannot access resources of another organization",
      });
    }

    // Org admin: org-level scope — can access any branch within their org
    if (userRole === "admin") return next();

    // Branch-level check for branch_admin, support, customer
    const userBranchId = req.user.branchId?.toString();
    const targetBranchId = resolveBranch(req)?.toString();

    if (!userBranchId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: User has no branch assigned",
      });
    }

    if (targetBranchId && targetBranchId !== userBranchId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Cannot access resources of another branch",
      });
    }

    next();
  };
};

/**
 * Enforce scope on a specific document/resource by looking it up.
 * Checks that the resource's org_id and branch_id match the user's scope.
 *
 * @param {Function} Model        Mongoose model to query
 * @param {string}   idParam      Route param holding the resource id (default "id")
 */
export const enforceResourceScope = (Model, idParam = "id") => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userRole = normalizeRoleName(req.user.roleName || req.user.role);
    if (isSuperAdmin(userRole)) return next();

    const resourceId = req.params?.[idParam];
    if (!resourceId) {
      return res.status(400).json({ success: false, message: `Missing resource id (${idParam})` });
    }

    try {
      const resource = await Model.findById(resourceId)
        .select("organization_id branch_id")
        .lean();

      if (!resource) {
        return res.status(404).json({ success: false, message: "Resource not found" });
      }

      const userOrgId = req.user.organizationId?.toString();
      const resourceOrgId = resource.organization_id?.toString();

      // Org check
      if (resourceOrgId && resourceOrgId !== userOrgId) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Cannot access resources of another organization",
        });
      }

      // Branch check (only for branch-scoped roles)
      if (userRole !== "admin") {
        const userBranchId = req.user.branchId?.toString();
        const resourceBranchId = resource.branch_id?.toString();

        if (resourceBranchId && userBranchId && resourceBranchId !== userBranchId) {
          return res.status(403).json({
            success: false,
            message: "Forbidden: Cannot access resources of another branch",
          });
        }
      }

      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
};

/**
 * Inject the user's scope into the request so downstream services
 * can use it without having to re-derive it.
 * Attaches req.scope = { organizationId, branchId, role, isSuperAdmin, isOrgAdmin }
 */
export const attachScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const role = normalizeRoleName(req.user.roleName || req.user.role);

  req.scope = {
    organizationId: req.user.organizationId?.toString() || null,
    branchId: req.user.branchId?.toString() || null,
    userId: (req.user.userId || req.user._id)?.toString() || null,
    role,
    isSuperAdmin: isSuperAdmin(role),
    isOrgAdmin: role === "admin",
    isBranchAdmin: role === "branch_admin",
    isSupport: role === "support",
    isCustomer: role === "customer",
  };

  next();
};

export default {
  enforceOrgScope,
  enforceBranchScope,
  enforceResourceScope,
  attachScope,
};
