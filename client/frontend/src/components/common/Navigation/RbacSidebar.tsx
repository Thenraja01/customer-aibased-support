import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  MessageCircle,
  Ticket,
  FileText,
  Bell,
  Shield,
  Search,
  ClipboardList,
  HeadphonesIcon,
  Building2,
  Users,
  ScrollText,
  FileCheck,
  BadgeCheck,
  HelpCircle,
  Brain,
  BarChart3,
  CreditCard,
  ClipboardCheck,
  Coins,
  Database,
  Layout,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  LayoutDashboard,
  MessageCircle,
  Ticket,
  FileText,
  Bell,
  Settings,
  Shield,
  Search,
  ClipboardList,
  HeadphonesIcon,
};

interface SidebarLink {
  name: string;
  path: string;
  icon: React.ComponentType<{ size?: number }>;
  permission?: string | null;
}

const superAdminLinks: SidebarLink[] = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard, permission: null },
  { name: "Organizations", path: "/admin/organizations", icon: Building2, permission: PERMISSIONS.MANAGE_ORGS },
  { name: "Users", path: "/admin/users", icon: Users, permission: PERMISSIONS.MANAGE_USERS },
  { name: "Roles", path: "/admin/roles", icon: Shield, permission: PERMISSIONS.MANAGE_ROLES },
  { name: "Audit Logs", path: "/admin/audit-logs", icon: ScrollText, permission: null },
  { name: "Subscriptions", path: "/admin/subscriptions", icon: CreditCard, permission: null },
  { name: "Org Approvals", path: "/admin/org-approvals", icon: ClipboardCheck, permission: null },
  { name: "Token Usage", path: "/admin/token-usage", icon: Coins, permission: null },
  { name: "AI Config", path: "/admin/ai-config", icon: Settings, permission: null },
  { name: "Content", path: "/admin/content", icon: Layout, permission: null },
  { name: "Search", path: "/admin/search", icon: Search, permission: null },
];

const orgAdminLinks: SidebarLink[] = [
  { name: "Dashboard", path: "/org-admin", icon: LayoutDashboard, permission: null },
  { name: "Users", path: "/org-admin/users", icon: Users, permission: PERMISSIONS.MANAGE_USERS },
  { name: "Documents", path: "/org-admin/documents", icon: FileText, permission: PERMISSIONS.MANAGE_DOCUMENTS },
  { name: "Doc Types", path: "/org-admin/document-types", icon: FileCheck, permission: null },
  { name: "Verifications", path: "/org-admin/document-verifications", icon: BadgeCheck, permission: PERMISSIONS.VERIFY_DOCUMENTS },
  { name: "FAQs", path: "/org-admin/faqs", icon: HelpCircle, permission: PERMISSIONS.MANAGE_FAQS },
  { name: "Chatbot", path: "/org-admin/chatbot", icon: MessageCircle, permission: null },
  { name: "AI Analytics", path: "/org-admin/ai-analytics", icon: Brain, permission: PERMISSIONS.VIEW_ANALYTICS },
  { name: "Log Management", path: "/org-admin/logs", icon: BarChart3, permission: null },
  { name: "Conversations", path: "/org-admin/conversations", icon: MessageCircle, permission: null },
  { name: "Knowledge Base", path: "/org-admin/knowledge-base", icon: Database, permission: null },
];

const agentLinks: SidebarLink[] = [
  { name: "Dashboard", path: "/agent/dashboard", icon: LayoutDashboard, permission: null },
  { name: "Chats", path: "/agent/chats", icon: MessageCircle, permission: PERMISSIONS.ACCESS_CHATBOT },
  { name: "Tickets", path: "/agent/tickets", icon: Ticket, permission: null },
  { name: "Settings", path: "/profile", icon: Settings, permission: null },
];

const supportLinks: SidebarLink[] = [
  { name: "Dashboard", path: "/support/dashboard", icon: LayoutDashboard, permission: null },
  { name: "Tickets", path: "/support/tickets", icon: ClipboardList, permission: null },
  { name: "Live Chat", path: "/support/chat", icon: MessageCircle, permission: null },
  { name: "Documents", path: "/support/documents", icon: FileText, permission: null },
  { name: "Notifications", path: "/support/notifications", icon: Bell, permission: null },
  { name: "Settings", path: "/profile", icon: Settings, permission: null },
];

const customerLinks: SidebarLink[] = [
  { name: "Chat", path: "/chat", icon: MessageCircle, permission: null },
  { name: "Tickets", path: "/tickets", icon: Ticket, permission: null },
];

interface RbacSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RbacSidebar({ isOpen, onClose }: RbacSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const uiConfig = useSelector((state: RootState) => state.auth?.ui_config ?? state.ui?.ui_config);

  const roleName =
    typeof user?.role_id === "object"
      ? user.role_id?.role_name
      : typeof user?.role_id === "string"
      ? user.role_id
      : "";

  const getLinks = (): SidebarLink[] => {
    const role = roleName;
    let baseLinks: SidebarLink[];

    if (role === "super_admin") {
      baseLinks = superAdminLinks;
    } else if (role === "admin") {
      baseLinks = orgAdminLinks;
    } else if (role === "agent") {
      baseLinks = agentLinks;
    } else if (role === "support") {
      baseLinks = supportLinks;
    } else {
      baseLinks = customerLinks;
    }

    return baseLinks.filter((link) => {
      if (!link.permission) return true;
      if (role === "super_admin") return true;
      return hasPermission(role, link.permission);
    });
  };

  const buildDynamicLinks = (): SidebarLink[] | null => {
    const navItems = uiConfig?.navigation;
    if (!navItems || navItems.length === 0) return null;
    return navItems
      .filter((n: any) => n.visible)
      .map((n: any) => ({
        name: n.label,
        path: n.path,
        icon: ICON_MAP[n.icon] ?? LayoutDashboard,
        permission: null,
      }));
  };

  const links = buildDynamicLinks() ?? getLinks();

  const brandName =
    uiConfig?.branding?.app_name ??
    (roleName === "support"
      ? "Support Portal"
      : roleName === "agent"
      ? "Agent Portal"
      : roleName === "super_admin"
      ? "System Admin"
      : roleName === "admin"
      ? "Org Admin"
      : "SupportAI");

  const isAdmin = roleName === "super_admin" || roleName === "admin";

  const isActiveLink = (link: SidebarLink) => {
    if (link.path === "/") return location.pathname === "/";
    if (link.path === "/admin") return location.pathname === "/admin";
    if (link.path === "/org-admin") return location.pathname === "/org-admin";
    return location.pathname.startsWith(link.path);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-card dark:bg-gradient-to-b dark:from-card dark:to-background/80 border-r dark:border-white/[0.06] transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            {uiConfig?.branding?.logo_url ? (
              <img src={uiConfig.branding.logo_url} alt="logo" className="h-7 w-7 rounded object-contain" />
            ) : (
              <HeadphonesIcon size={20} className="text-primary" />
            )}
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {brandName}
            </span>
          </div>
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >

          </button>
        </div>

        {/* Role badge */}
        <div className="px-6 py-2 border-b dark:border-white/[0.04]">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-primary/80 bg-primary/10 rounded-full px-2.5 py-0.5">
            <Shield size={10} />
            {roleName}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = isActiveLink(link);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/15 dark:shadow-sm dark:shadow-primary/10"
                    : "text-muted-foreground hover:bg-muted dark:hover:bg-white/[0.04] hover:text-foreground"
                }`}
                onClick={onClose}
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t dark:border-white/[0.06] space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          {!isAdmin && (
            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-white/[0.04] transition-colors"
              onClick={onClose}
            >
              <Settings size={18} />
              <span>Settings</span>
            </Link>
          )}
          <button
            onClick={() => { logout(); onClose(); }}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 dark:hover:bg-destructive/15 transition-colors w-full"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
