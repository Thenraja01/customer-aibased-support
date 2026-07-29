import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Clock,
  HelpCircle,
  FileText,
  CheckSquare,
  FileType,
  Sparkles,
  AlertTriangle,
  ListOrdered,
  Globe,
  Bell,
  Send,
  Settings,
  Zap,
  Building2,
  UserCheck,
  Shield,
  ScrollText,
  Settings2,
  MessageCircle,
  History,
  Plus,
  Ticket,
  ShieldCheck,
} from "lucide-react";

/**
 * Navigation & page configuration.
 *
 * Single source of truth for both the sidebar menu AND which component the
 * active layout renders. Each entry declares:
 *   - `id`          → stable key stored in global state (Redux `navigation`)
 *   - `path`        → URL route (kept in sync; detail pages use `:param`)
 *   - `component`   → lazy component rendered when this page is active
 *
 * Adding a new module = adding one entry here. Nothing else in the app needs
 * to change (routes are generated from this same config).
 */

export interface SidebarNavItem {
  /** Stable page key used by the global navigation state. */
  id: string;
  name: string;
  path?: string;
  icon: LucideIcon;
  /** Lazy page component rendered when this item is active. Groups omit it. */
  component?: LazyExoticComponent<ComponentType<any>>;
  /** Nested links rendered as a collapsible group. */
  children?: SidebarNavItem[];
  /** Badge colour key. Mapped to a count via `badgeCounts` in the layout. */
  badge?: "danger" | "warning";
  /** Permission required to see this item. If omitted, always visible. */
  permission?: string;
}

export interface SidebarNavSection {
  /** Optional section heading rendered above its items. */
  section?: string;
  items: SidebarNavItem[];
}

export type SidebarConfig = SidebarNavSection[];

/** Super Admin portal. */
export const superAdminSidebar: SidebarConfig = [
  {
    items: [
      { id: "command-center", name: "Command Center", path: "/superadmin/command-center", icon: Zap, component: lazy(() => import("@/pages/SuperAdmin/CommandCenterPage")), permission: "*" },
      { id: "dashboard", name: "Dashboard", path: "/superadmin/dashboard", icon: LayoutDashboard, component: lazy(() => import("@/pages/SuperAdmin/SuperAdminDashboard")), permission: "report.view_dashboard" },
      { id: "organizations", name: "Organizations", path: "/superadmin/organizations", icon: Building2, component: lazy(() => import("@/pages/SuperAdmin/OrganizationsPage")), permission: "org.view" },
      { id: "users", name: "Users", path: "/superadmin/users", icon: Users, component: lazy(() => import("@/pages/SuperAdmin/UsersPage")), permission: "user.view" },
      { id: "pending-admins", name: "Pending Admins", path: "/superadmin/pending-org-admins", icon: UserCheck, component: lazy(() => import("@/pages/SuperAdmin/PendingOrgAdminsPage")), permission: "registration.approve" },
      { id: "roles", name: "Roles", path: "/superadmin/roles", icon: Shield, component: lazy(() => import("@/pages/SuperAdmin/RolesPage")), permission: "role.view" },
      { id: "audit-logs", name: "Audit Logs", path: "/superadmin/audit-logs", icon: ScrollText, component: lazy(() => import("@/pages/SuperAdmin/AuditLogsPage")), permission: "report.view" },
      { id: "ai-analytics", name: "AI Analytics", path: "/superadmin/ai-analytics", icon: Sparkles, component: lazy(() => import("@/pages/Admin/AIAnalyticsPage")), permission: "report.view" },
      { id: "communication", name: "Communication", path: "/superadmin/communication", icon: Globe, component: lazy(() => import("@/pages/SuperAdmin/SuperAdminCommunicationPage")), permission: "ai.train_kb" },
      { id: "notifications", name: "Notifications", path: "/superadmin/notifications", icon: Bell, component: lazy(() => import("@/pages/SuperAdmin/SendNotificationPage")), permission: "ai.train_kb" },
      { id: "app-settings", name: "App Settings", path: "/superadmin/app-settings", icon: Settings2, component: lazy(() => import("@/pages/SuperAdmin/AppSettingsPage")), permission: "*" },
    ],
  },
];

/** Tenant Admin portal. */
export const adminSidebar: SidebarConfig = [
  {
    items: [
      { id: "dashboard", name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard, component: lazy(() => import("@/pages/Admin/AdminDashboard")), permission: "report.view_dashboard" },
      { id: "users", name: "Users", path: "/admin/users", icon: Users, component: lazy(() => import("@/pages/Admin/AdminUsersPage")), permission: "user.view" },
      { id: "team", name: "Team & Role", path: "/admin/team", icon: UserCheck, component: lazy(() => import("@/pages/Admin/OrgUsersPage")), permission: "user.view" },
      { id: "roles", name: "Role Management", path: "/admin/roles", icon: Shield, component: lazy(() => import("@/pages/Admin/RolesPage")), permission: "role.view" },
      { id: "role-permissions", name: "Role Permissions", path: "/admin/permissions", icon: ShieldCheck, component: lazy(() => import("@/pages/Admin/RolePermissionsPage")), permission: "role.view" },
      { id: "pending-approvals", name: "Pending Approvals", path: "/admin/pending-approvals", icon: Clock, badge: "warning", component: lazy(() => import("@/pages/Admin/PendingApprovalsPage")), permission: "registration.approve" },
      { id: "faq", name: "FAQ", path: "/admin/faq", icon: HelpCircle, component: lazy(() => import("@/pages/Admin/FAQPage")), permission: "knowledge.create" },
      {
        id: "documents",
        name: "Documents",
        icon: FileText,
        children: [
          { id: "documents-all", name: "All Documents", path: "/admin/documents", icon: FileText, component: lazy(() => import("@/pages/Admin/DocumentsManagementPage")), permission: "document.view_all" },
          { id: "documents-verifications", name: "Document Verification", path: "/admin/verifications", icon: CheckSquare, component: lazy(() => import("@/pages/Admin/OrgDocumentVerificationsPage")), permission: "document.view_all" },
          { id: "document-types", name: "Document Types", path: "/admin/document-types", icon: FileType, component: lazy(() => import("@/pages/Admin/DocumentTypesPage")), permission: "*" },
        ],
      },
      { id: "ai-control", name: "AI Control", path: "/admin/ai", icon: Sparkles, component: lazy(() => import("@/pages/Admin/AIControlCenterPage")), permission: "ai.train_kb" },
      { id: "branches", name: "Branches", path: "/admin/branches", icon: Building2, component: lazy(() => import("@/pages/Admin/BranchesPage")), permission: "branch.view" },
      { id: "knowledge-gaps", name: "Knowledge Gaps", path: "/admin/knowledge-gaps", icon: AlertTriangle, component: lazy(() => import("@/pages/Admin/KnowledgeGapPage")), permission: "ai.train_kb" },
      { id: "queue", name: "Queue", path: "/admin/queue", icon: ListOrdered, component: lazy(() => import("@/pages/Admin/QueueManagementPage")), permission: "ticket.assign" },
      { id: "communication", name: "Communication", path: "/admin/communication", icon: Globe, component: lazy(() => import("@/pages/Admin/AdminCommunicationPage")), permission: "chat.view_history" },
      { id: "notifications", name: "Notifications", path: "/admin/notifications", icon: Bell, badge: "danger", component: lazy(() => import("@/pages/Admin/NotificationsPage")), permission: "notification.view" },
      { id: "send-notification", name: "Send Notification", path: "/admin/notifications/send", icon: Send, component: lazy(() => import("@/pages/Admin/SendNotificationPage")), permission: "notification.create" },
      { id: "settings", name: "Settings", path: "/admin/settings", icon: Settings, component: lazy(() => import("@/pages/Admin/OrganizationSettingsPage")), permission: "org.manage" },
    ],
  },
];

/** Support agent portal. */
export const supportSidebar: SidebarConfig = [
  {
    items: [
      { id: "dashboard", name: "Dashboard", path: "/support/dashboard", icon: LayoutDashboard, component: lazy(() => import("@/pages/Support/SupportDashboard")), permission: "ticket.assign" },
      { id: "tickets", name: "Tickets", path: "/support/tickets", icon: Ticket, component: lazy(() => import("@/pages/Support/SupportTicketsPage")), permission: "ticket.assign" },
      { id: "queue", name: "Queue", path: "/support/queue", icon: ListOrdered, component: lazy(() => import("@/pages/Admin/QueueManagementPage")), permission: "ticket.assign" },
      { id: "faq", name: "FAQ", path: "/support/faq", icon: HelpCircle, component: lazy(() => import("@/pages/Support/SupportFAQPage")), permission: "knowledge.view" },
      { id: "notifications", name: "Notifications", path: "/support/notifications", icon: Bell, component: lazy(() => import("@/pages/Admin/NotificationsPage")), permission: "notification.view" },
      {
        id: "chats",
        name: "Chats",
        icon: MessageCircle,
        children: [
          { id: "chat", name: "Chat", path: "/support/chat", icon: MessageCircle, component: lazy(() => import("@/pages/Support/SupportChatPage")), permission: "chat.view" },
          { id: "chat-history", name: "AIChats", path: "/support/chat-history", icon: History, component: lazy(() => import("@/pages/Support/SupportChatHistoryPage")), permission: "chat.view_history" },
        ],
      },
    ],
  },
];

/** Customer portal. */
export const customerSidebar: SidebarConfig = [
  {
    items: [
      { id: "dashboard", name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, component: lazy(() => import("@/pages/Customer/CustomerDashboard")) },
      {
        id: "chat",
        name: "Chat",
        icon: MessageCircle,
        children: [
          { id: "chat-new", name: "New Chat", path: "/chat", icon: Plus, component: lazy(() => import("@/pages/Customer/ChatPage")), permission: "chat.view" },
          { id: "chat-history", name: "AIChats", path: "/chat-history", icon: History, component: lazy(() => import("@/pages/Customer/ChatHistoryPage")), permission: "chat.view" },
        ],
      },
      { id: "tickets", name: "Tickets", path: "/tickets", icon: Ticket, component: lazy(() => import("@/pages/Customer/TicketsPage")), permission: "ticket.create" },
      { id: "faq", name: "FAQ", path: "/faq", icon: HelpCircle, component: lazy(() => import("@/pages/Customer/FAQPage")), permission: "knowledge.view" },
      { id: "notifications", name: "Notifications", path: "/notifications", icon: Bell, component: lazy(() => import("@/pages/Customer/NotificationsPage")), permission: "notification.view" },
    ],
  },
];