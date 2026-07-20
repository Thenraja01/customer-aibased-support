import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/utils/formatters';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
};

const colorMap = {
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  success: 'text-green-500',
  error: 'text-red-500',
};

interface NotificationListProps {
  compact?: boolean;
}

export function NotificationList({ compact }: NotificationListProps) {
  const { notifications, loading, markRead, markAllRead, loadNotifications, loadUnreadCount } = useNotifications();

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  const handleMarkRead = (id: string) => {
    markRead(id);
    loadUnreadCount();
  };

  const displayed = compact ? notifications.slice(0, 5) : notifications;

  return (
    <div className="space-y-1">
      {!compact && notifications.length > 0 && (
        <div className="flex justify-end mb-2">
          <Button variant="ghost" size="sm" onClick={() => { markAllRead(); loadUnreadCount(); }}>
            <CheckCheck size={14} className="mr-1" /> Mark all read
          </Button>
        </div>
      )}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Bell size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No notifications</p>
        </div>
      ) : (
        <div className="space-y-1">
          {displayed.map((notif: any) => {
            const Icon = iconMap[notif.type as keyof typeof iconMap] || Bell;
            return (
              <button
                key={notif._id}
                onClick={() => handleMarkRead(notif._id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-colors',
                  notif.status === 'unread' ? 'bg-primary/5' : 'hover:bg-muted'
                )}
              >
                <div className="flex gap-3">
                  <Icon
                    size={16}
                    className={cn(
                      'mt-0.5 shrink-0',
                      colorMap[notif.type as keyof typeof colorMap]
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{notif.title}</p>
                    {notif.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatRelativeTime(notif.created_at)}
                    </p>
                  </div>
                  {notif.status === 'unread' && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
