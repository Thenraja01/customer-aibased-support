import {
  LayoutDashboard,
  MessageCircle,
  Ticket,
  Bell,
  User,
  HelpCircle,
  FileText,
  FileType,
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
  Shield,
  Database,
  Globe,
  CreditCard,
  Activity,
  FileSearch,
  BookOpen,
  FolderTree,
  Cpu,
  Braces,
  ShieldAlert,
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
    label: "My Tickets",
    path: "/support/tickets",
    icon: Ticket,
    roles: [ROLE_KEYS.SUPPORT],
    section: "SUPPORT",
  },
  {
    label: "Customer Conversations",
    path: "/support/chat-history",
    icon: MessageCircle,
    roles: [ROLE_KEYS.SUPPORT],
    section: "SUPPORT",
  },
  {
    label: "AI Assistant",
    path: "/support/chat",
    icon: Sparkles,
    roles: [ROLE_KEYS.SUPPORT],
    section: "SUPPORT",
  },
  {
    label: "Knowledge Base",
    path: "/support/faq",
    icon: BookOpen,
    roles: [ROLE_KEYS.SUPPORT],
    section: "KNOWLEDGE",
  },
  {
    label: "Documents",
    path: "/support/documents",
    icon: FileText,
    roles: [ROLE_KEYS.SUPPORT],
    section: "KNOWLEDGE",
  },
  {
    label: "Queue",
    path: "/support/queue",
    icon: ListOrdered,
    roles: [ROLE_KEYS.SUPPORT],
    section: "SUPPORT",
  },
  {
    label: "Notifications",
    path: "/support/notifications",
    icon: Bell,
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
    label: "Branch Tickets",
    path: "/support/tickets",
    icon: Ticket,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Customers",
    path: "/admin/users",
    icon: Users,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "ORGANIZATION MANAGEMENT",
  },
  {
    label: "Support Agents",
    path: "/admin/team",
    icon: Users,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "ORGANIZATION MANAGEMENT",
  },
  {
    label: "AI Assistant",
    path: "/support/chat",
    icon: Sparkles,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Admin Copilot",
    path: "/branch/copilot",
    icon: Sparkles,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "SUPPORT",
  },
  {
    label: "FAQ",
    path: "/admin/faq",
    icon: HelpCircle,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "AI & KNOWLEDGE",
  },
  {
    label: "Documents",
    path: "/branch/documents",
    icon: FileText,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "AI & KNOWLEDGE",
  },
  {
    label: "Branches",
    path: "/admin/branches",
    icon: Building2,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "ORGANIZATION MANAGEMENT",
  },
  {
    label: "Reports",
    path: "/admin/ai-analytics",
    icon: BarChart3,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "AI & KNOWLEDGE",
  },
  {
    label: "Notifications",
    path: "/admin/notifications",
    icon: Bell,
    roles: [ROLE_KEYS.BRANCH_ADMIN],
    section: "PLATFORM",
  },

  // Admin Navigation
  {
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: [ROLE_KEYS.ADMIN],
    section: "OVERVIEW",
  },
  {
    label: "Chat",
    path: "/admin/chatbot",
    icon: MessageCircle,
    roles: [ROLE_KEYS.ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Admin Copilot",
    path: "/admin/copilot",
    icon: Sparkles,
    roles: [ROLE_KEYS.ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Tickets",
    path: "/support/tickets",
    icon: Ticket,
    roles: [ROLE_KEYS.ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Customers",
    path: "/admin/users",
    icon: Users,
    roles: [ROLE_KEYS.ADMIN],
    section: "ORGANIZATION MANAGEMENT",
  },
  {
    label: "Branches",
    path: "/admin/branches",
    icon: Building2,
    roles: [ROLE_KEYS.ADMIN],
    section: "ORGANIZATION MANAGEMENT",
  },
  {
    label: "Users",
    path: "/admin/team",
    icon: Users,
    roles: [ROLE_KEYS.ADMIN],
    section: "ORGANIZATION MANAGEMENT",
  },
  {
    label: "Knowledge Base",
    path: "/admin/faq",
    icon: BookOpen,
    roles: [ROLE_KEYS.ADMIN],
    section: "AI & KNOWLEDGE",
    children: [
      {
        label: "FAQ",
        path: "/admin/faq",
        icon: HelpCircle,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Topics & Graph",
        path: "/admin/topics",
        icon: FolderTree,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Documents",
        path: "/admin/documents",
        icon: FileText,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Document Verification",
        path: "/admin/verifications",
        icon: CheckSquare,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Document Types",
        path: "/admin/document-types",
        icon: FileType,
        roles: [ROLE_KEYS.ADMIN],
      },
    ],
  },
  {
    label: "AI Configuration",
    path: "/admin/ai",
    icon: Sparkles,
    roles: [ROLE_KEYS.ADMIN],
    section: "AI & KNOWLEDGE",
    children: [
      {
        label: "System Prompt",
        path: "/admin/ai",
        icon: Cpu,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Model",
        path: "/admin/ai",
        icon: Database,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "RAG Settings",
        path: "/admin/ai",
        icon: Braces,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Guardrails",
        path: "/admin/ai",
        icon: ShieldAlert,
        roles: [ROLE_KEYS.ADMIN],
      },
    ],
  },
  {
    label: "Reports",
    path: "/admin/ai-analytics",
    icon: BarChart3,
    roles: [ROLE_KEYS.ADMIN],
    section: "AI & KNOWLEDGE",
  },
  {
    label: "Model Health",
    path: "/admin/model-health",
    icon: Cpu,
    roles: [ROLE_KEYS.ADMIN],
    section: "AI & KNOWLEDGE",
  },
  {
    label: "Audit Logs",
    path: "/admin/audit-logs",
    icon: FileSearch,
    roles: [ROLE_KEYS.ADMIN],
    section: "PLATFORM",
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: Settings,
    roles: [ROLE_KEYS.ADMIN],
    section: "PLATFORM",
    children: [
      {
        label: "Organization",
        path: "/admin/settings",
        icon: Building2,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Branches",
        path: "/admin/branches",
        icon: Building2,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Users",
        path: "/admin/users",
        icon: Users,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Roles",
        path: "/admin/roles",
        icon: Shield,
        roles: [ROLE_KEYS.ADMIN],
      },
      {
        label: "Preferences",
        path: "/admin/settings",
        icon: Settings,
        roles: [ROLE_KEYS.ADMIN],
      },
    ],
  },
  {
    label: "Queue",
    path: "/admin/queue",
    icon: ListOrdered,
    roles: [ROLE_KEYS.ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Chat History",
    path: "/admin/chat-history",
    icon: MessageCircle,
    roles: [ROLE_KEYS.ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Notifications",
    path: "/admin/notifications",
    icon: Bell,
    roles: [ROLE_KEYS.ADMIN],
    section: "PLATFORM",
  },
  {
    label: "Send Notification",
    path: "/admin/notifications/send",
    icon: Send,
    roles: [ROLE_KEYS.ADMIN],
    section: "PLATFORM",
  },
  {
    label: "Knowledge Gaps",
    path: "/admin/knowledge-gaps",
    icon: AlertTriangle,
    roles: [ROLE_KEYS.ADMIN],
    section: "AI & KNOWLEDGE",
  },
  {
    label: "Pending Approvals",
    path: "/admin/pending-approvals",
    icon: Clock,
    roles: [ROLE_KEYS.ADMIN],
    section: "ORGANIZATION MANAGEMENT",
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
    path: "/superadmin/organizations",
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
    label: "Communication",
    path: "/superadmin/communication",
    icon: Send,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Global Search",
    path: "/superadmin/search",
    icon: Globe,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Business AI Copilot",
    path: "/superadmin/copilot",
    icon: Sparkles,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Chat History",
    path: "/superadmin/chat-history",
    icon: MessageCircle,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "SUPPORT",
  },
  {
    label: "Platform Settings",
    path: "/superadmin/app-settings",
    icon: Settings,
    roles: [ROLE_KEYS.SUPER_ADMIN],
    section: "PLATFORM",
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
  if (hasChildren) {
    return currentPath.startsWith(itemPath);
  }
  
  // Exact match or starts with path (for dynamic routes)
  if (currentPath === itemPath) return true;
  
  // Handle dynamic routes like /tickets/:id
  const baseRoute = itemPath.split("/:")[0];
  if (currentPath.startsWith(baseRoute + "/")) return true;
  
  return false;
}
