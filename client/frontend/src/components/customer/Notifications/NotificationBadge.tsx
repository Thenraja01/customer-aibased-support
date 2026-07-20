import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useEffect } from 'react';

export function NotificationBadge() {
  const { unreadCount, loadUnreadCount } = useNotifications();

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  return (
    <div className="relative">
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
}
