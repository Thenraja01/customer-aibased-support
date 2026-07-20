import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/formatters';
import { Bot, User } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '@/types/chat.types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.is_ai;

  return (
    <div
      className={cn(
        'flex gap-3 max-w-[80%]',
        isAI ? 'items-start' : 'items-start flex-row-reverse ml-auto'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isAI ? 'bg-primary/10' : 'bg-muted'
        )}
      >
        {isAI ? (
          <Bot size={16} className="text-primary" />
        ) : (
          <User size={16} className="text-muted-foreground" />
        )}
      </div>
      <div>
        <div
          className={cn(
            'rounded-lg px-4 py-2 text-sm',
            isAI
              ? 'bg-muted text-foreground'
              : 'bg-primary text-primary-foreground'
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <p
          className={cn(
            'text-[11px] text-muted-foreground mt-1',
            isAI ? 'text-left' : 'text-right'
          )}
        >
          {formatDateTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
