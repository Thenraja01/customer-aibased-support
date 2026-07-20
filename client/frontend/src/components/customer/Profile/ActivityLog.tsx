import { useState, useEffect } from 'react';
import { formatRelativeTime } from '@/utils/formatters';
import { Activity, Clock } from 'lucide-react';
import type { ActivityLog as ActivityLogType } from '@/types/user.types';

export function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLogType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { UsersAPI } = await import('@/api/user.api');
      const res = await UsersAPI.getActivityLogs();
      setLogs(res.data.data || []);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">No activity recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log._id} className="flex items-start gap-3 p-3 rounded-lg border">
          <Clock size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{log.action}</p>
            {log.details && (
              <p className="text-xs text-muted-foreground">{log.details}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formatRelativeTime(log.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
