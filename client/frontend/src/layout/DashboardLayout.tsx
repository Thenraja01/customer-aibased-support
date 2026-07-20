import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Bell, X } from "lucide-react";
import RbacSidebar from "@/components/common/Navigation/RbacSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();
  const { notifications, unreadCount, loadNotifications, loadUnreadCount, markRead, markAllRead } =
    useNotifications();

  useEffect(() => {
    if (user?._id) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [user, loadNotifications, loadUnreadCount]);

  const roleName =
    typeof user?.role_id === "object"
      ? user.role_id?.role_name
      : typeof user?.role_id === "string"
      ? user.role_id
      : "";

  const portalLabel =
    roleName === "support"
      ? "Support Portal"
      : roleName === "agent"
      ? "Agent Portal"
      : roleName === "super_admin" || roleName === "admin"
      ? "Admin Portal"
      : "Customer Portal";

  return (
    <div className="flex h-screen bg-background font-sans">
      <RbacSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-card dark:bg-card/80 border-b dark:border-white/[0.06]">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="text-lg font-semibold lg:hidden">{portalLabel}</div>
          <div className="flex items-center gap-2 justify-end w-full">
            {/* Notification bell */}
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
                          onClick={() => { markAllRead(); loadUnreadCount(); }}
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
                              if (!notif.read) { markRead(notif._id); loadUnreadCount(); }
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
