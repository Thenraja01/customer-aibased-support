import { useState, useEffect } from "react";
import { Moon, Sun, Type, Bell, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useFontSettings } from "@/context/FontSettingsContext";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import ChatDropdown from "./chat/ChatDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { settings, setFontSize } = useFontSettings();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loadNotifications,
    markRead,
    markAllRead,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  const toggleFont = () => {
    const sizes: ("small" | "medium" | "large" | "x-large")[] = ["small", "medium", "large", "x-large"];
    const currentIndex = sizes.indexOf(settings.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setFontSize(sizes[nextIndex]);
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getImageUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const base = backendUrl.replace(/\/+$/, "");
    const path = url.replace(/^\/+/, "");
    return `${base}/${path}`;
  };

  const getNotificationsPath = () => {
    const rawRole = user?.role || user?.roleName;
    const role = (typeof rawRole === "object" ? rawRole?.role_name : rawRole) || "";
    const lowerRole = role.toLowerCase().replace(/[\s_]+/g, "_");

    if (lowerRole === "support") return "/support/notifications";
    if (lowerRole === "admin" || lowerRole === "branch_admin") return "/admin/notifications";
    if (lowerRole === "super_admin") return "/superadmin/notifications";
    return "/notifications";
  };

  const handleNotificationClick = (notif: any, e: React.MouseEvent) => {
    e.preventDefault();
    if (!notif.is_read) {
      markRead(notif._id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAllRead();
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.is_read === b.is_read) {
      return new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime();
    }
    return a.is_read ? 1 : -1;
  });

  return (
    <header className="flex h-14 items-center justify-end border-b border-white/[0.06] px-4 md:px-6 bg-background shrink-0">
      <div className="flex items-center gap-2">
        <ChatDropdown />
        
        {/* Real Notification Dropdown */}
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="relative transition-all duration-200"
              />
            }
          >
            <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white px-1 ring-2 ring-background animate-pulse-glow">
                {unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 border border-white/[0.06] bg-card shadow-2xl rounded-xl overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-muted/20">
              <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-white/[0.06] scrollbar-thin">
              {sortedNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                sortedNotifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={(e) => handleNotificationClick(notif, e)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors relative ${!notif.is_read ? 'bg-indigo-500/[0.02]' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs truncate ${!notif.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                          {notif.title}
                        </p>
                        {!notif.is_read && (
                          <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[9px] text-muted-foreground/60 mt-1.5 font-medium">
                        {notif.created_at || notif.createdAt
                          ? formatDistanceToNow(new Date(notif.created_at || notif.createdAt), { addSuffix: true })
                          : "Just now"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <DropdownMenuSeparator className="m-0 bg-white/[0.06]" />
            <div className="p-2 bg-muted/10">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs h-8 text-muted-foreground hover:text-foreground font-medium"
                onClick={() => {
                  setIsOpen(false);
                  navigate(getNotificationsPath());
                }}
              >
                View all notifications
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <TooltipPrimitive.Provider>
          {/* Font Toggle */}
          <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleFont}>
                <Type className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </Button>
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
              <TooltipPrimitive.Content side="bottom" className="bg-popover text-popover-foreground px-2 py-1 text-xs rounded shadow-md z-50">
                Change Font Size
                <TooltipPrimitive.Arrow />
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          </TooltipPrimitive.Root>

          {/* Theme Toggle */}
          <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                ) : (
                  <Moon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                )}
              </Button>
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
              <TooltipPrimitive.Content side="bottom" className="bg-popover text-popover-foreground px-2 py-1 text-xs rounded shadow-md z-50">
                Toggle Theme
                <TooltipPrimitive.Arrow />
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>

        {/* User Avatar */}
        {user?.profileImage ? (
          <img
            src={getImageUrl(user.profileImage)}
            alt={user.name || "User"}
            className="h-8 w-8 ml-2 rounded-full object-cover border border-white/[0.06] shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => navigate("/profile")}
          />
        ) : (
          <div
            className="h-8 w-8 ml-2 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => navigate("/profile")}
          >
            {getInitials(user?.name)}
          </div>
        )}
      </div>
    </header>
  );
}
