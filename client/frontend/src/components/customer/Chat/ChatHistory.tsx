import { useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/utils/formatters';
import { MessageSquare } from 'lucide-react';

interface ChatHistoryProps {
  onSelectChat: (id: string) => void;
  activeChatId?: string | null;
}

export function ChatHistory({ onSelectChat, activeChatId }: ChatHistoryProps) {
  const { chats, loading, loadUserChats } = useChat();

  useEffect(() => {
    loadUserChats();
  }, [loadUserChats]);

  const openChats = chats.filter((c) => c.status === 'open');
  const closedChats = chats.filter((c) => c.status === 'closed');

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Chat History
      </h3>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No chats yet</p>
        </div>
      ) : (
        <>
          {openChats.map((chat) => (
            <button
              key={chat._id}
              onClick={() => onSelectChat(chat._id)}
              className={cn(
                'w-full text-left p-3 rounded-lg transition-colors',
                activeChatId === chat._id
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              )}
            >
              <p className="text-sm font-medium truncate">{chat.topic}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatRelativeTime(chat.created_at)}
              </p>
            </button>
          ))}
          {closedChats.length > 0 && (
            <>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Past conversations</p>
              </div>
              {closedChats.slice(0, 5).map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => onSelectChat(chat._id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-colors opacity-60 hover:opacity-100',
                    activeChatId === chat._id && 'bg-primary/10 text-primary opacity-100'
                  )}
                >
                  <p className="text-sm font-medium truncate">{chat.topic}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(chat.created_at)}
                  </p>
                </button>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
