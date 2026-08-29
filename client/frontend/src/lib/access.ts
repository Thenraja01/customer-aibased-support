import { getRoleName, normalizeRoleName, ROLE_KEYS } from "./roles";

export type Portal = "customer" | "support" | "admin" | "superadmin" | "branch";

const PORTAL_ROUTES: Record<Portal, string> = {
  customer: "/dashboard",
  support: "/support/dashboard",
  admin: "/admin/dashboard",
  superadmin: "/superadmin/dashboard",
  branch: "/branch/dashboard",
};

export function resolvePortal(user: any): Portal | null {
  if (!user) return null;
  
  const roleName = normalizeRoleName(getRoleName(user));
  
  if (roleName === ROLE_KEYS.SUPER_ADMIN) return "superadmin";
  if (roleName === ROLE_KEYS.ADMIN) return "admin";
  if (roleName === ROLE_KEYS.BRANCH_ADMIN) return "branch";
  if (roleName === ROLE_KEYS.SUPPORT) return "support";
  if (roleName === ROLE_KEYS.CUSTOMER) return "customer";
  
  return null;
}

export function homePathFor(user: any): string {
  const portal = resolvePortal(user);
  return portal ? PORTAL_ROUTES[portal] : "/login";
}

export function canAccessPortal(user: any, portal: Portal): boolean {
  return resolvePortal(user) === portal;
}
