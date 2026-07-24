import { useEffect, useState } from "react";
import {
  Bell, CheckCheck, Trash2, RefreshCw, Filter, BellOff, Info, AlertTriangle, MessageSquare, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationAPI } from "@/api/notification.api.js";
import { useAuth } from "@/hooks/useAuth";

type FilterTab = "all" | "unread";

function getNotifIcon(type?: string) {
  switch (type) {
    case "alert":
      return <AlertTriangle size={16} className="text-amber-500" />;
    case "message":
      return <MessageSquare size={16} className="text-blue-500" />;
    case "document":
      return <FileText size={16} className="text-emerald-500" />;
    case "info":
    default:
      return <Info size={16} className="text-primary" />;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const {
    notifications,
    loading,
    unreadCount,
    loadNotifications,
    loadUnreadCount,
    markRead,
    markAllRead,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterTab>("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  const filtered = filter === "unread"
    ? notifications.filter((n: any) => !n.read)
    : notifications;

  const handleMarkRead = (id: string) => {
    markRead(id);
    loadUnreadCount();
  };

  const handleMarkAllRead = () => {
    markAllRead();
    loadUnreadCount();
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await NotificationAPI.delete(id);
      loadNotifications();
      loadUnreadCount();
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const handleClearAll = async () => {
    if (!user?._id) return;
    if (!window.confirm("Clear all notifications? This cannot be undone.")) return;
    setClearing(true);
    try {
      await NotificationAPI.clearAll(user._id);
      loadNotifications();
      loadUnreadCount();
    } catch {
      // silent
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="text-primary" size={28} />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your alerts and updates in one place.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { loadNotifications(); loadUnreadCount(); }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border bg-background hover:bg-muted transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border bg-background hover:bg-muted transition-colors text-primary border-primary/30"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-destructive/40 bg-background text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={14} />
              {clearing ? "Clearing…" : "Clear all"}
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b dark:border-white/[0.06]">
        {(["all", "unread"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 -mb-px capitalize",
              filter === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Filter size={13} />
            {tab}
            {tab === "unread" && unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border bg-card">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <BellOff size={28} className="text-muted-foreground/50" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {filter === "unread" ? "All caught up!" : "No notifications yet"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "unread"
              ? "You have no unread notifications."
              : "Notifications will appear here when they arrive."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {(filtered as any[]).map((notif) => (
            <div
              key={notif._id}
              className={cn(
                "group relative rounded-xl border bg-card p-4 transition-all duration-200 hover:shadow-md",
                !notif.read
                  ? "border-primary/30 bg-primary/[0.03] dark:bg-primary/[0.06]"
                  : "hover:bg-muted/30 dark:hover:bg-white/[0.02]"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  "shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                  !notif.read ? "bg-primary/10 dark:bg-primary/20" : "bg-muted"
                )}>
                  {getNotifIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      "text-sm truncate",
                      !notif.read ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                    )}>
                      {notif.title || notif.message}
                    </p>
                    {!notif.read && (
                      <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" aria-label="Unread" />
                    )}
                  </div>
                  {notif.message && notif.title && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground/60 mt-1.5">
                    {timeAgo(notif.created_at)} · {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.read && (
                    <button
                      title="Mark as read"
                      onClick={() => handleMarkRead(notif._id)}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button
                    title="Delete"
                    onClick={() => handleDelete(notif._id)}
                    disabled={deleting === notif._id}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
