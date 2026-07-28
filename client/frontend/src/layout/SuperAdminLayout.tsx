import { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, ScrollText,
  Sparkles, Search, MessageCircle, Settings2,
  Settings, ArrowLeft, LogOut, Menu, Bell, X, Zap, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

const navLinks = [
  { name: "Command Center", path: "/superadmin/command-center", icon: Zap },
  { name: "Dashboard", path: "/superadmin/dashboard", icon: LayoutDashboard },
  { name: "Organizations", path: "/superadmin/organizations", icon: Building2 },
  { name: "Users", path: "/superadmin/users", icon: Users },
  { name: "Audit Logs", path: "/superadmin/audit-logs", icon: ScrollText },
  { name: "AI Analytics", path: "/superadmin/ai-analytics", icon: Sparkles },
  { name: "Knowledge Gaps", path: "/superadmin/knowledge-gaps", icon: AlertTriangle },
  { name: "Search", path: "/superadmin/search", icon: Search },
  { name: "Chat History", path: "/superadmin/chat-history", icon: MessageCircle },
  { name: "App Settings", path: "/superadmin/app-settings", icon: Settings2 },
];

export default function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const { user, orgSettings, logout } = useAuth();
  const orgName = orgSettings?.name || user?.organization_id?.name || "SupportAI";
  const orgLogo = orgSettings?.logo?.url || null;
  const { notifications, unreadCount, loadNotifications, loadUnreadCount, markRead, markAllRead } = useNotifications();
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  useEffect(() => {
    setSidebarOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showNotifications && notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSidebarOpen(false);
      setShowNotifications(false);
    }
  }, []);

  return (
    <div className="flex h-screen bg-background font-sans" onKeyDown={handleKeyDown}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden animate-in fade-in duration-200" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <aside aria-label="Sidebar navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-card dark:bg-gradient-to-b dark:from-card dark:to-background/80 border-r dark:border-white/[0.06] transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b dark:border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            {orgLogo ? (
              <img src={orgLogo} alt={orgName} className="h-8 w-8 rounded shrink-0" />
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-bold truncate bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{orgName}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Super Admin</p>
            </div>
          </div>
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground shrink-0" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"><X size={18} /></button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.path === "/admin"
              ? location.pathname === "/admin"
              : location.pathname === link.path || location.pathname.startsWith(link.path + "/");
            return (
              <Link key={link.name} to={link.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  isActive
                    ? "bg-primary/10 text-primary dark:bg-primary/15"
                    : "text-muted-foreground hover:bg-muted dark:hover:bg-white/[0.04] hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t dark:border-white/[0.06] space-y-1">
          <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-white/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
            <Settings size={18} /><span>Settings</span>
          </Link>
          <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-white/[0.04] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
            <ArrowLeft size={18} /><span>Back to Home</span>
          </Link>
          <button onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 dark:hover:bg-destructive/15 transition-colors w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
          >
            <LogOut size={18} /><span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-card dark:bg-card/80 border-b dark:border-white/[0.06]">
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><Menu size={22} /></button>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative" ref={notifRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}>
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card dark:bg-card/95 rounded-xl shadow-xl border dark:border-white/[0.06] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/[0.06]">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button onClick={() => { markAllRead(); loadUnreadCount(); }} className="text-xs text-primary hover:underline">Mark all read</button>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="p-1 rounded hover:bg-muted" aria-label="Close notifications"><X size={14} /></button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell size={24} className="mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y dark:divide-white/[0.04]" role="list">
                        {notifications.slice(0, 10).map((notif: any) => (
                          <div key={notif._id} role="listitem"
                            className={`px-4 py-3 hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer ${!notif.read ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                            onClick={() => { if (!notif.read) { markRead(notif._id); loadUnreadCount(); } }}
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === "Enter" && !notif.read) { markRead(notif._id); loadUnreadCount(); } }}
                          >
                            <p className="text-sm font-medium truncate">{notif.title || notif.message}</p>
                            {notif.message && notif.title && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>}
                            <p className="text-[11px] text-muted-foreground/70 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/30 dark:bg-background/50">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
