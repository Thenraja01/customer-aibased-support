import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  ScrollText,
  FileText,
  FileCheck,
  BadgeCheck,
  ArrowLeft,
  LogOut,
  Settings,
  HelpCircle,
  Brain,
  MessageSquare,
  BarChart3,
  CreditCard,
  ClipboardCheck,
  Coins,
  Database,
  Layout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { slideIn } from "@/lib/animations";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/rbac";

const allLinks = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard, permission: null },
  { name: "Organizations", path: "/admin/organizations", icon: Building2, permission: PERMISSIONS.MANAGE_ORGS },
  { name: "Users", path: "/admin/users", icon: Users, permission: PERMISSIONS.MANAGE_USERS },
  { name: "Roles", path: "/admin/roles", icon: Shield, permission: PERMISSIONS.MANAGE_ROLES },
  { name: "Documents", path: "/admin/documents", icon: FileText, permission: PERMISSIONS.MANAGE_DOCUMENTS },
  { name: "Doc Types", path: "/admin/document-types", icon: FileCheck, permission: PERMISSIONS.MANAGE_DOCUMENTS },
  { name: "Verifications", path: "/admin/document-verifications", icon: BadgeCheck, permission: PERMISSIONS.VERIFY_DOCUMENTS },
  { name: "FAQs", path: "/admin/faqs", icon: HelpCircle, permission: PERMISSIONS.MANAGE_FAQS },
  { name: "Chatbot", path: "/admin/chatbot", icon: MessageSquare, permission: PERMISSIONS.ACCESS_CHATBOT },
  { name: "AI Analytics", path: "/admin/ai-analytics", icon: Brain, permission: PERMISSIONS.VIEW_ANALYTICS },
  { name: "Log Management", path: "/admin/logs", icon: BarChart3, permission: PERMISSIONS.VIEW_ANALYTICS },
  { name: "Audit Logs", path: "/admin/audit-logs", icon: ScrollText, permission: PERMISSIONS.VIEW_ANALYTICS },
  { name: "Subscriptions", path: "/admin/subscriptions", icon: CreditCard, permission: null },
  { name: "Org Approvals", path: "/admin/org-approvals", icon: ClipboardCheck, permission: null },
  { name: "Token Usage", path: "/admin/token-usage", icon: Coins, permission: null },
  { name: "AI Config", path: "/admin/ai-config", icon: Settings, permission: null },
  { name: "Conversations", path: "/admin/conversations", icon: MessageSquare, permission: null },
  { name: "Knowledge Base", path: "/admin/knowledge-base", icon: Database, permission: null },
  { name: "Content", path: "/admin/content", icon: Layout, permission: null },
];

export default function AdminSidebar({
  isSidebarOpen,
  onClose,
}: {
  isSidebarOpen: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const roleName = user?.role_id?.role_name ?? "";

  const links = allLinks.filter((link) => {
    if (!link.permission) return true;
    if (roleName === "super_admin") return true;
    return hasPermission(roleName, link.permission);
  });

  return (
    <>
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        {...slideIn}
        transition={{ duration: 0.3 }}
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform bg-card dark:bg-gradient-to-b dark:from-card dark:to-background/80 border-r dark:border-white/[0.06] transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b dark:border-white/[0.06]">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Admin
          </span>
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/15 dark:shadow-sm dark:shadow-primary/10"
                    : "text-muted-foreground hover:bg-muted dark:hover:bg-white/[0.04] hover:text-foreground"
                )}
                onClick={onClose}
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t dark:border-white/[0.06] space-y-1">
          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-white/[0.04] transition-colors"
            onClick={onClose}
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-white/[0.04] transition-colors"
            onClick={onClose}
          >
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </Link>
          <button
            onClick={() => { logout(); onClose(); }}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 dark:hover:bg-destructive/15 transition-colors w-full"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
