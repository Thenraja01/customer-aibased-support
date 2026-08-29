import {
  LayoutDashboard,
  MessageCircle,
  Ticket,
  Bell,
  User,
  HelpCircle,
  FileText,
  Sparkles,
  Settings,
  Users,
  Building2,
  ListOrdered,
  CheckSquare,
  AlertTriangle,
  Clock,
  Send,
  BarChart3,
  CreditCard,
  Activity,
  FileSearch,
  BookOpen,
  FolderTree,
  Cpu,
  ShieldAlert,
  Inbox,
  Sliders,
  Key,
  UserCheck,
  Eye,
  BrainCircuit,
} from "lucide-react";
import { ROLE_KEYS } from "@/lib/roles";

export type UserRole = typeof ROLE_KEYS[keyof typeof ROLE_KEYS];

export interface NavItem {
  label: string;
  path: string;
  icon: any;
  roles?: UserRole[];
  badge?: string | number;
  children?: NavItem[];
  separator?: boolean;
  section?: string;
}

export const navigationConfig: NavItem[] = [
  // Customer Navigation
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: [ROLE_KEYS.CUSTOMER],
    section: "OVERVIEW",
  },
  {
    label: "Chat",
    path: "/chat",
    icon: MessageCircle,
    roles: [ROLE_KEYS.CUSTOMER],
    section: "SUPPORT",
  },
  {
    label: "My Tickets",
    path: "/tickets",
    icon: Ticket,
    roles: [ROLE_KEYS.CUSTOMER],
    section: "SUPPORT",
  },
  {
    label: "My Conversations",
    path: "/chat-history",
    icon: MessageCircle,
    roles: [ROLE_KEYS.CUSTOMER],
    section: "SUPPORT",
  },
  {
    label: "Help / Knowledge",
    path: "/faq",
    icon: HelpCircle,
    roles: [ROLE_KEYS.CUSTOMER],
    section: "KNOWLEDGE",
  },
  {
    label: "Documents",
    path: "/documents",
    icon: FileText,
    roles: [ROLE_KEYS.CUSTOMER],
    section: "KNOWLEDGE",
  },
  {
    label: "Notifications",
    path: "/notifications",
    icon: Bell,
    roles: [ROLE_KEYS.CUSTOMER],
    section: "PLATFORM",
  },
  {
    label: "Profile",
    path: "/profile",
    icon: User,
    roles: [ROLE_KEYS.CUSTOMER],
    section: "PLATFORM",
  },

  // Support Navigation
  {
    label: "Dashboard",
    path: "/support/dashboard",
    icon: LayoutDashboard,
    roles: [ROLE_KEYS.SUPPORT],
    section: "OVERVIEW",
  },
  {
    label: "Live Human Handoff",
    path: "/support/live-handoff",
    icon: UserCheck,
    roles: [ROLE_KEYS.SUPPORT],
    section: "SUPPORT WORKSPACE",
  },
  {
    label: "AI Copilot Assistant",
    path: "/support/ai",
    icon: Sparkles,
    roles: [ROLE_KEYS.SUPPORT],
    section: "SUPPORT WORKSPACE",
  },
  {
    label: "Customer Conversations",
    path: "/support/chat-history",
    icon: MessageCircle,
    roles: [ROLE_KEYS.SUPPORT],
    section: "SUPPORT WORKSPACE",
  },
  {
    label: "Support Tickets",
    path: "/support/tickets",
    icon: Ticket,
    roles: [ROLE_KEYS.SUPPORT],
    section: "SUPPORT WORKSPACE",
  },
  {
    label: "Active Queue",
    path: "/support/queue",
    icon: ListOrdered,
    roles: [ROLE_KEYS.SUPPORT],
    section: "SUPPORT WORKSPACE",
  },
  {
    label: "Knowledge Base",
    path: "/support/faq",
    icon: BookOpen,
    roles: [ROLE_KEYS.SUPPORT],
    section: "KNOWLEDGE HUB",
  },
  {
    label: "Documents",
    path: "/support/documents",
    icon: FileText,
    roles: [ROLE_KEYS.SUPPORT],
    section: "KNOWLEDGE HUB",
  },
  {
    label: "Notifications",
    path: "/support/notifications",
    icon: Bell,
    roles: [ROLE_KEYS.SUPPORT],
    section: "PLATFORM",
  },
  {
    label: "Profile",
    path: "/support/profile",
    icon: User,
    roles: [ROLE_KEYS.SUPPORT],
    section: "PLATFORM",
  },

  // Branch Admin Navigation
  {
    label: "Dashboard",
    path: "/branch/dashboard",
    icon: LayoutDashboard,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "OVERVIEW",
  },
  {
    label: "Branch Live Support",
    path: "/branch/live-support",
    icon: MessageCircle,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Branch Tickets",
    path: "/branch/tickets",
    icon: Ticket,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Support Agents",
    path: "/branch/agents",
    icon: Users,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "MANAGEMENT",
  },
  {
    label: "Customers",
    path: "/branch/customers",
    icon: Users,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "MANAGEMENT",
  },
  {
    label: "Knowledge Base",
    path: "/branch/knowledge",
    icon: BookOpen,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "AI & KNOWLEDGE",
  },
  {
    label: "Branch FAQs",
    path: "/branch/faq",
    icon: HelpCircle,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "AI & KNOWLEDGE",
  },
  {
    label: "SLA Policy",
    path: "/branch/sla",
    icon: Clock,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "OPERATIONS",
  },
  {
    label: "Branch Analytics",
    path: "/branch/analytics",
    icon: BarChart3,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "OPERATIONS",
  },
  {
    label: "Notifications",
    path: "/branch/notifications",
    icon: Bell,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "PLATFORM",
  },
  {
    label: "Branch Settings",
    path: "/branch/settings",
    icon: Settings,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "PLATFORM",
  },

  // Admin Navigation - EMBEDDED AI PLATFORM (Configuration & Deployment Layer)
  {
    label: "Embedded Platform",
    path: "/admin/embedded-overview",
    icon: Sparkles,
    roles: [ROLE_KEYS.ADMIN],
    section: "EMBEDDED AI PLATFORM",
    children: [
      {
        label: "Overview",
        path: "/admin/embedded-overview",
        icon: LayoutDashboard,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Knowledge Base",
        path: "/admin/embedded-knowledge",
        icon: BookOpen,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Chatbot Config",
        path: "/admin/embedded-chatbot",
        icon: Sparkles,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "API Keys & Embed",
        path: "/admin/api-keys",
        icon: Key,
        roles: [ROLE_KEYS.ADMIN],
      },
    ],
  },
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: [ROLE_KEYS.ADMIN],
    section: "OVERVIEW",
  },
  {
    label: "Live Chat Monitoring",
    path: "/admin/live-chat",
    icon: Eye,
    roles: [ROLE_KEYS.ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Chat",
    path: "/admin/chatbot",
    icon: MessageCircle,
    roles: [ROLE_KEYS.ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Tickets",
    path: "/admin/tickets",
    icon: Ticket,
    roles: [ROLE_KEYS.ADMIN],
    section: "SUPPORT",
    children: [
      {
        label: "All Tickets",
        path: "/admin/tickets",
        icon: Inbox,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Escalated",
        path: "/admin/tickets/escalated",
        icon: AlertTriangle,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Ticket Templates",
        path: "/admin/tickets/templates",
        icon: FileText,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Form Customization",
        path: "/admin/tickets/form-customization",
        icon: Sliders,
        roles: [ROLE_KEYS.ADMIN],
      },
    ],
  },
  {
    label: "Queue / Dispatch",
    path: "/admin/queue",
    icon: ListOrdered,
    roles: [ROLE_KEYS.ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Customers",
    path: "/admin/users",
    icon: Users,
    roles: [ROLE_KEYS.ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Knowledge Base",
    path: "/admin/documents",
    icon: BookOpen,
    roles: [ROLE_KEYS.ADMIN],
    section: "KNOWLEDGE",
  },
  {
    label: "Knowledge Graph",
    path: "/admin/topics",
    icon: FolderTree,
    roles: [ROLE_KEYS.ADMIN],
    section: "KNOWLEDGE",
  },
  {
    label: "AI Configuration",
    path: "/admin/ai",
    icon: Sparkles,
    roles: [ROLE_KEYS.ADMIN],
    section: "AI",
  },
  {
    label: "AI Intelligence Center",
    path: "/admin/ai-intelligence",
    icon: BrainCircuit,
    roles: [ROLE_KEYS.ADMIN],
    section: "AI",
  },
  {
    label: "Model Health",
    path: "/admin/model-health",
    icon: Cpu,
    roles: [ROLE_KEYS.ADMIN],
    section: "AI",
  },
  {
    label: "Knowledge Gaps",
    path: "/admin/knowledge-gaps",
    icon: ShieldAlert,
    roles: [ROLE_KEYS.ADMIN],
    section: "AI",
  },
  {
    label: "Branches",
    path: "/admin/branches",
    icon: Building2,
    roles: [ROLE_KEYS.ADMIN],
    section: "ORGANIZATION",
  },
  {
    label: "Team & Users",
    path: "/admin/team",
    icon: Users,
    roles: [ROLE_KEYS.ADMIN],
    section: "ORGANIZATION",
  },
  {
    label: "Pending Approvals",
    path: "/admin/pending-approvals",
    icon: CheckSquare,
    roles: [ROLE_KEYS.ADMIN],
    section: "ORGANIZATION",
  },
  {
    label: "Audit Logs",
    path: "/admin/audit-logs",
    icon: FileSearch,
    roles: [ROLE_KEYS.ADMIN],
    section: "SYSTEM",
  },
  {
    label: "Notifications",
    path: "/admin/notifications",
    icon: Bell,
    roles: [ROLE_KEYS.ADMIN],
    section: "SYSTEM",
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: Settings,
    roles: [ROLE_KEYS.ADMIN],
    section: "SYSTEM",
  },

  // Super Admin Navigation
  {
    label: "Platform Dashboard",
    path: "/superadmin/dashboard",
    icon: LayoutDashboard,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "OVERVIEW",
  },
  {
    label: "System Monitoring",
    path: "/superadmin/command-center",
    icon: Activity,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "OVERVIEW",
  },
  {
    label: "Tenants",
    path: "/superadmin/organizations",
    icon: Building2,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "ORGANIZATION MANAGEMENT",
  },
  {
    label: "Subscriptions",
    path: "/superadmin/subscriptions",
    icon: CreditCard,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "ORGANIZATION MANAGEMENT",
  },
  {
    label: "Platform Users",
    path: "/superadmin/users",
    icon: Users,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "ORGANIZATION MANAGEMENT",
  },
  {
    label: "Pending Org Admins",
    path: "/superadmin/pending-org-admins",
    icon: Clock,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "ORGANIZATION MANAGEMENT",
  },
  {
    label: "Platform Analytics",
    path: "/superadmin/ai-analytics",
    icon: BarChart3,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "AI & KNOWLEDGE",
  },
  {
    label: "Audit Logs",
    path: "/superadmin/audit-logs",
    icon: FileSearch,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "PLATFORM",
  },
  {
    label: "Notifications",
    path: "/superadmin/notifications",
    icon: Bell,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "PLATFORM",
  },
  {
    label: "Send Notification",
    path: "/superadmin/notifications/send",
    icon: Send,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "PLATFORM",
  },
];

export function filterNavigationByRole(
  navigation: NavItem[],
  userRoles: UserRole[]
): NavItem[] {
  return navigation
    .filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.some((role) => userRoles.includes(role));
    })
    .map((item) => ({
      ...item,
      children: item.children
        ? filterNavigationByRole(item.children, userRoles)
        : undefined,
    }))
    .filter((item) => {
      // Remove items with no children after filtering
      if (item.children && item.children.length === 0) {
        return false;
      }
      return true;
    });
}

export function getNavigationForRole(role: UserRole): NavItem[] {
  return filterNavigationByRole(navigationConfig, [role]);
}

export function isActiveRoute(
  currentPath: string,
  itemPath: string,
  hasChildren: boolean = false
): boolean {
  const cleanCurrent = currentPath.split("?")[0];
  const cleanItem = itemPath.split("?")[0];

  if (hasChildren) {
    return cleanCurrent === cleanItem || cleanCurrent.startsWith(cleanItem + "/");
  }
  
  if (currentPath === itemPath) return true;
  
  if (cleanCurrent === cleanItem) {
    if (itemPath.includes("?")) {
      return currentPath === itemPath;
    }
    return true;
  }

  const baseRoute = itemPath.split("/:")[0].split("?")[0];
  if (cleanCurrent.startsWith(baseRoute + "/")) return true;
  
  return false;
}
