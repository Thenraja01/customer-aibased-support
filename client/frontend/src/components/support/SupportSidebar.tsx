import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  FileCheck,
  Bell,
  Settings,
  LogOut,
  X,
  HeadphonesIcon,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

/**
 * SupportSidebar — Dedicated sidebar for the Support role.
 *
 * Restricted access:
 *   ✅ Dashboard, Tickets, Live Chat, Document Verification, Notifications, Profile
 *   ❌ User management, org settings, analytics, AI config (admin-only)
 */

const SUPPORT_LINKS = [
  {
    section: "Main",
    links: [
      { name: "Dashboard",     path: "/support/dashboard",  icon: LayoutDashboard },
      { name: "Tickets",       path: "/support/tickets",     icon: ClipboardList },
      { name: "Live Chat",     path: "/support/chat",        icon: MessageSquare },
    ],
  },
  {
    section: "Documents",
    links: [
      { name: "Verification",  path: "/support/documents",   icon: FileCheck },
    ],
  },
  {
    section: "Account",
    links: [
      { name: "Notifications", path: "/support/notifications", icon: Bell },
      { name: "Profile",       path: "/profile",               icon: Settings },
    ],
  },
];

interface SupportSidebarProps {
  isSidebarOpen: boolean;
  onClose: () => void;
}

export default function SupportSidebar({ isSidebarOpen, onClose }: SupportSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const uiConfig = useSelector(
    (state: RootState) => (state.auth as any)?.ui_config ?? (state.ui as any)?.ui_config
  );

  const brandName = uiConfig?.branding?.app_name ?? "Support Portal";

  const isActive = (path: string) =>
    path === "/support/dashboard"
      ? location.pathname === "/support/dashboard"
      : location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile overlay */}
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
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform",
          "bg-card dark:bg-gradient-to-b dark:from-card dark:to-background/80",
          "border-r dark:border-white/[0.06]",
          "transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
          "flex flex-col",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            {uiConfig?.branding?.logo_url ? (
              <img
                src={uiConfig.branding.logo_url}
                alt="logo"
                className="h-7 w-7 rounded object-contain"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <HeadphonesIcon size={16} className="text-primary" />
              </div>
            )}
            <span className="font-bold text-base bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
              {brandName}
            </span>
          </div>
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground p-1 rounded"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 py-2.5 border-b dark:border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Support Agent
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
          {SUPPORT_LINKS.map((section) => (
            <div key={section.section}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {section.section}
              </p>
              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                        active
                          ? "bg-primary/10 text-primary dark:bg-primary/15"
                          : "text-muted-foreground hover:bg-muted dark:hover:bg-white/[0.04] hover:text-foreground"
                      )}
                    >
                      <Icon size={17} />
                      <span className="flex-1">{link.name}</span>
                      {active && <ChevronRight size={14} className="opacity-60" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t dark:border-white/[0.06] space-y-1">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-muted/50 dark:bg-white/[0.03]">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">
                  {user.name?.[0]?.toUpperCase() ?? "S"}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
          <button
            onClick={() => { logout(); onClose(); }}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 transition-colors w-full"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
