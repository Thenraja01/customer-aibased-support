import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationAPI } from "@/api";
import { Bell, Check, CheckCheck, Trash2, BellOff } from "lucide-react";

interface Notification {
  _id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    if (!user?._id) return;
    try {
      const res = await NotificationAPI.getByUser(user._id);
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationAPI.markRead(notificationId);
      setNotifications(
        notifications.map((notif) =>
          notif._id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?._id) return;
    try {
      await NotificationAPI.markAllRead(user._id);
      setNotifications(notifications.map((notif) => ({ ...notif, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await NotificationAPI.delete(notificationId);
      setNotifications(notifications.filter((notif) => notif._id !== notificationId));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const clearAll = async () => {
    if (!user?._id) return;
    if (!confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await NotificationAPI.clearAll(user._id);
      setNotifications([]);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold ">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Stay updated with your alerts and messages.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            >
              <CheckCheck size={14} />
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
            >
              <Trash2 size={14} />
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellOff size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-white/[0.04]">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`px-6 py-4 hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors ${
                  !notification.is_read ? "bg-primary/5 dark:bg-primary/10" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        !notification.is_read
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Bell size={18} />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          !notification.is_read ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check size={16} className="text-muted-foreground" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
