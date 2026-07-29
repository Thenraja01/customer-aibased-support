import type { SidebarConfig, SidebarNavItem } from "@/config/sidebar";
import {
  superAdminSidebar,
  adminSidebar,
  supportSidebar,
  customerSidebar,
} from "@/config/sidebar";

export type Portal = "superadmin" | "admin" | "support" | "customer";

export const PORTAL_SIDEBARS: Record<Portal, SidebarConfig> = {
  superadmin: superAdminSidebar,
  admin: adminSidebar,
  support: supportSidebar,
  customer: customerSidebar,
};

export function resolvePortal(user: any): Portal {
  if (!user) return "customer";

  const perms = user.permissions || [];
  const hasWildcard = perms.includes("*");

  if (hasWildcard) return "superadmin";
  if (perms.includes("user.view")) return "admin";
  if (perms.includes("report.view_dashboard") || perms.includes("ticket.assign") || perms.includes("chat.end")) return "support";

  return "customer";
}

/** Landing path for the current user based on their role. */
export function homePathFor(user: any): string {
  switch (resolvePortal(user)) {
    case "superadmin":
      return "/superadmin/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "support":
      return "/support/dashboard";
    default:
      return "/dashboard";
  }
}

/** Flatten a sidebar config into a flat list of leaf nav items. */
export function flattenNavItems(config: SidebarConfig): SidebarNavItem[] {
  return config.flatMap((section) =>
    section.items.flatMap((item) =>
      item.children && item.children.length ? item.children : [item]
    )
  );
}

/** Find a nav item (leaf or group) by its stable `id`. */
export function findNavItemById(
  config: SidebarConfig,
  id: string | null | undefined
): SidebarNavItem | null {
  if (!id) return null;
  for (const section of config) {
    for (const item of section.items) {
      if (item.id === id) return item;
      if (item.children) {
        const child = item.children.find((c) => c.id === id);
        if (child) return child;
      }
    }
  }
  return null;
}

/** Find the leaf nav item whose `path` exactly matches a URL pathname. */
export function findLeafByExactPath(
  config: SidebarConfig,
  pathname: string
): SidebarNavItem | null {
  return flattenNavItems(config).find((item) => item.path === pathname) || null;
}
