// client/frontend/src/utils/subdomainRouter.ts
// Standard route resolver based on user role (subdomains removed)

export function getRoleDashboardPath(role?: string): string {
  const r = (role || "").toLowerCase().replace(/[\s_]+/g, "_");
  if (r === "super_admin" || r === "platform_admin") {
    return "/superadmin/dashboard";
  } else if (r === "admin") {
    return "/admin/dashboard";
  } else if (r === "branch_admin") {
    return "/branch/dashboard";
  } else if (r === "support") {
    return "/support/dashboard";
  }
  return "/dashboard";
}

export function constructRoleSubdomainUrl(user: any, targetPath?: string): string {
  if (targetPath) return targetPath;
  return getRoleDashboardPath(user?.role || user?.roleName);
}

export function redirectUserToRoleSubdomain(_user: any, _token: string, _targetPath?: string): boolean {
  // Subdomain redirection disabled - standard path-based routing is used
  return false;
}

