import { normalizeRoleName, isNormalizedAdminRole } from "../../utils/constants.js";
import { getAction, getActionByTool, getActionsForRole, isRoleAllowed } from "./actionRegistry.js";

/**
 * Agent-level RBAC gate + scope resolver.
 *
 * Resolves a user's effective data scope from their raw role and enforces
 * whether a given agent action may be invoked. All scope decisions live here
 * so intent planning, flow resolution and execution share one source of truth.
 */

export const SCOPES = {
  PLATFORM: "platform",
  ORGANIZATION: "organization",
  BRANCH: "branch",
  NONE: "none",
};

/**
 * Resolve a user's data scope + normalized identity from req.user.
 */
export const resolveScope = (user) => {
  if (!user) {
    return {
      userId: null,
      organizationId: null,
      branchIds: [],
      role: null,
      scope: SCOPES.NONE,
      isSuperAdmin: false,
    };
  }

  const rawRole =
    user.roleName ||
    (typeof user.role === "string" ? user.role : null) ||
    (Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : null) ||
    user.role_id?.role_name ||
    user.role_id?.name ||
    null;
  const role = normalizeRoleName(rawRole);
  const organizationId = user.organization_id?._id || user.organization_id || user.organizationId;
  const branchId = user.branch_id?._id || user.branch_id || user.branchId || null;
  const branchIds = branchId ? [branchId.toString()] : [];

  let scope = SCOPES.NONE;
  if (role === "super_admin") scope = SCOPES.PLATFORM;
  else if (role === "admin") scope = SCOPES.ORGANIZATION;
  else if (role === "branch_admin" || role === "support") scope = SCOPES.BRANCH;

  return {
    userId: (user.userId || user._id)?.toString() || null,
    organizationId: organizationId?.toString() || null,
    branchId: branchId?.toString() || null,
    branchIds,
    role,
    scope,
    isSuperAdmin: role === "super_admin",
    isAdmin: isNormalizedAdminRole(role),
    permissions: user.permissions || [],
  };
};

/**
 * Human-readable scope policy for the LLM prompt.
 */
export const scopePolicyPrompt = (scope, role) => {
  const map = {
    platform:
      "APPLICATION scope (super_admin): access to every organization, branch, user and audit log on the platform.",
    organization:
      "ORGANIZATION scope (admin): access to all branches and data within the current organization only.",
    branch:
      `BRANCH scope (${role}): access to data of the user's branch only.`,
    none: "NO scope: the user is not authenticated for business data access.",
  };
  return map[scope] || map.none;
};

/**
 * Actions visible to a role — metadata only, used for tool-list generation.
 */
export const getVisibleActions = (roleName) => getActionsForRole(roleName);

/**
 * Enforce that a role may run a given action name. Returns { allowed, action, reason }.
 */
export const enforceActionAccess = (roleName, actionName) => {
  const normalized = normalizeRoleName(roleName);
  if (!normalized) return { allowed: false, action: actionName, reason: "Unauthenticated" };
  if (isRoleAllowed(normalized, actionName)) {
    return { allowed: true, action: actionName, reason: null };
  }
  return {
    allowed: false,
    action: actionName,
    reason: `Role "${normalized}" is not authorized for "${actionName}"`,
  };
};

/**
 * Resolve an action by tool function name and check access for the role.
 */
export const resolveActionForRole = (roleName, toolName) => {
  if (!toolName || typeof toolName !== "string" || !toolName.trim()) {
    return { allowed: false, action: null, reason: "Tool name is missing or invalid" };
  }
  const cleanTool = toolName.trim();
  const action = getActionByTool(cleanTool) || getAction(cleanTool);
  if (!action) {
    return { allowed: false, action: null, reason: `Unknown tool "${cleanTool}"` };
  }
  const gate = enforceActionAccess(roleName, action.name);
  return { ...gate, action };
};

export default {
  SCOPES,
  resolveScope,
  scopePolicyPrompt,
  getVisibleActions,
  enforceActionAccess,
  resolveActionForRole,
};
