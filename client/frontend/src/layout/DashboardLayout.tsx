import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  MessageCircle,
  Ticket,
  Bell,
  X,
} from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { notifications, unreadCount, loadNotifications, loadUnreadCount, markRead, markAllRead } = useNotifications();

  const roleName = user?.role_id?.role_name;

  useEffect(() => {
    if (user?._id) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [user, loadNotifications, loadUnreadCount]);

  const customerLinks = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Chat", path: "/chat", icon: MessageCircle },
    { name: "Tickets", path: "/tickets", icon: Ticket },
    { name: "Settings", path: "/profile", icon: Settings },
  ];

  const agentLinks = [
    { name: "Dashboard", path: "/agent/dashboard", icon: LayoutDashboard },
    { name: "Chats", path: "/agent/chats", icon: MessageCircle },
    { name: "Tickets", path: "/agent/tickets", icon: Ticket },
    { name: "Settings", path: "/profile", icon: Settings },
  ];

  let links: typeof customerLinks = [];
  if (roleName === "agent") {
    links = agentLinks;
  } else if (roleName !== "super_admin" && roleName !== "admin") {
    links = customerLinks;
  }

  return (
    <div className="flex h-screen bg-background font-sans">
      {roleName === "super_admin" || roleName === "admin" ? (
        <AdminSidebar
          isSidebarOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      ) : (
        <>
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <aside
            className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-card dark:bg-gradient-to-b dark:from-card dark:to-background/80 border-r transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 flex flex-col dark:border-white/[0.06] ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between h-16 px-6 border-b dark:border-white/[0.06]">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {roleName === "agent" ? "Agent Portal" : "SupportAI"}
              </span>
              <button
                className="lg:hidden text-muted-foreground hover:text-foreground"
                onClick={() => setIsSidebarOpen(false)}
              >
                &times;
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 text-primary dark:bg-primary/15 dark:shadow-sm dark:shadow-primary/10"
                        : "text-muted-foreground hover:bg-muted dark:hover:bg-white/[0.04] hover:text-foreground"
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t dark:border-white/[0.06]">
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 dark:hover:bg-destructive/15 transition-colors w-full"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-card dark:bg-card/80 border-b dark:border-white/[0.06]">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="text-lg font-semibold lg:hidden">
            {roleName === "super_admin" ? "Super Admin" : roleName === "agent" ? "Agent Portal" : "Dashboard"}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card dark:bg-card/95 dark:backdrop-blur-md rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/10 border dark:border-white/[0.06] z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/[0.06]">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            markAllRead();
                            loadUnreadCount();
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded hover:bg-muted"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell size={24} className="mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y dark:divide-white/[0.04]">
                        {notifications.slice(0, 10).map((notif: any) => (
                          <div
                            key={notif._id}
                            className={`px-4 py-3 hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer ${
                              !notif.read ? "bg-primary/5 dark:bg-primary/10" : ""
                            }`}
                            onClick={() => {
                              if (!notif.read) {
                                markRead(notif._id);
                                loadUnreadCount();
                              }
                            }}
                          >
                            <p className="text-sm font-medium line-clamp-1">{notif.title || notif.message}</p>
                            {notif.message && notif.title && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground/70 mt-1">
                              {new Date(notif.created_at).toLocaleDateString()}
                            </p>
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

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30 dark:bg-background/50">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
