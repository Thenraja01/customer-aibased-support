/**
 * Role hierarchy — single source of truth for the frontend.
 *
 *   Level 0  SUPER_ADMIN   Platform owner. Creates and manages organizations and all admins.
 *   Level 1  ADMIN         Organization administrator. Creates branches, branch admins, support users, and customers.
 *   Level 2  BRANCH_ADMIN  Manages a single branch, its support staff, and customers.
 *   Level 3  SUPPORT       Assists customers within their assigned branch.
 *   Level 4  CUSTOMER      End user with access only to their own account.
 */

export const ROLE_KEYS = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  BRANCH_ADMIN: "branch_admin",
  SUPPORT: "support",
  CUSTOMER: "customer",
} as const;

export const ROLE_LEVELS: Record<string, number> = {
  [ROLE_KEYS.SUPER_ADMIN]: 0,
  [ROLE_KEYS.ADMIN]: 1,
  [ROLE_KEYS.BRANCH_ADMIN]: 2,
  [ROLE_KEYS.SUPPORT]: 3,
  [ROLE_KEYS.CUSTOMER]: 4,
};

/** Highest level (lowest privilege) in the hierarchy. */
export const HIGHEST_ROLE_LEVEL = 4;

export const SYSTEM_ROLE_NAMES: string[] = Object.values(ROLE_KEYS);

/** Normalize a role name: lowercase, strip spaces/underscores. */
export function normalizeRoleName(roleName: any): string {
  if (!roleName) return "";
  return String(roleName).toLowerCase().trim().replace(/[\s_]+/g, "_");
}

/** Extract the effective role name from a user object. */
export function getRoleName(user: any): string {
  if (!user) return "";
  if (typeof user.role_id === "object" && user.role_id?.role_name) {
    return user.role_id.role_name;
  }
  return user.roleName || user.role || user.role_id || "";
}

/** Return the hierarchy level for a role name (or highest level if unknown). */
export function getRoleLevel(roleName: any): number {
  const normalized = normalizeRoleName(roleName);
  return typeof ROLE_LEVELS[normalized] === "number"
    ? ROLE_LEVELS[normalized]
    : HIGHEST_ROLE_LEVEL;
}

/** True when the role is at-or-above (has at least) the given privilege level. */
export function roleAtOrAbove(roleName: any, requiredLevel: number): boolean {
  return getRoleLevel(roleName) <= requiredLevel;
}

/** True when the user holds any of the given roles (normalized). */
export function hasAnyRole(user: any, allowedRoles: string[]): boolean {
  if (!user) return false;
  const roleName = getRoleName(user);
  if (!roleName) return false;
  const normalized = normalizeRoleName(roleName);
  return allowedRoles.some((r) => normalizeRoleName(r) === normalized);
}

/** True when the user is an admin-level role (super_admin, admin, branch_admin). */
export function isAdminRole(user: any): boolean {
  return roleAtOrAbove(getRoleName(user), 2);
}

/** True when the user can manage roles (super_admin, admin; branch limited). */
export function canManageRoles(user: any): boolean {
  return roleAtOrAbove(getRoleName(user), 1);
}

/** True when the user can manage users. */
export function canManageUsers(user: any): boolean {
  return roleAtOrAbove(getRoleName(user), 2);
}

/** True when the user can create organizations (super_admin, admin). */
export function canCreateOrganization(user: any): boolean {
  return roleAtOrAbove(getRoleName(user), 1);
}
