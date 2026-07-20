import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime } from '@/utils/formatters';
import { Users, Clock } from 'lucide-react';
import { ChatAPI } from '@/api/chat.api';

export function ChatMonitoring() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      const res = await ChatAPI.getAll({ status: 'open' });
      setSessions(res.data.data || []);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {loading ? (
        [1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
        ))
      ) : sessions.length === 0 ? (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          <Users size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No active chat sessions</p>
        </div>
      ) : (
        sessions.map((session) => (
          <Card key={session._id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm truncate">{session.topic}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {session.messagesCount || 0} msgs
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>{session.user_id?.name || session.user_id}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatRelativeTime(session.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
