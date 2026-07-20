import { useChat } from '@/hooks/useChat';
import { formatRelativeTime } from '@/utils/formatters';
import { MessageSquare, CheckCircle, Clock } from 'lucide-react';

export function ChatSessionList() {
  const { chats, loading, selectChat, loadMessages } = useChat();

  const handleSelect = (chat: any) => {
    selectChat(chat);
    loadMessages(chat._id);
  };

  return (
    <div className="space-y-2">
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : chats.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No conversations</p>
        </div>
      ) : (
        chats.map((chat) => (
          <button
            key={chat._id}
            onClick={() => handleSelect(chat)}
            className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate">{chat.topic}</p>
              {chat.status === 'open' ? (
                <Clock size={14} className="text-green-500 shrink-0" />
              ) : (
                <CheckCircle size={14} className="text-muted-foreground shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatRelativeTime(chat.created_at)}
            </p>
          </button>
        ))
      )}
    </div>
  );
}
