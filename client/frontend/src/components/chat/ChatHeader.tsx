import { memo } from "react";
import { Headphones, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Chat } from "@/types/chat";

interface ChatHeaderProps {
  activeChat: Chat | null;
  onOpenTicket: () => void;
}

const ChatHeader = memo(function ChatHeader({ activeChat, onOpenTicket }: ChatHeaderProps) {
  const isNew = !activeChat;
  const isClosed = activeChat?.status === "closed";

  return (
    <div className="flex items-center justify-between border-b dark:border-white/[0.06] px-6 py-4 bg-background/50 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm shadow-primary/20">
          {isNew ? (
            <MessageCircle size={15} className="text-primary-foreground" />
          ) : (
            <Headphones size={15} className="text-primary-foreground" />
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold">
            {isNew ? "New Chat" : "Support Chat"}
          </h2>
          {!isNew && (
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isClosed ? "bg-muted" : "bg-green-500 animate-pulse"
                }`}
              />
              <p className="text-xs text-muted-foreground">
                {isClosed ? "Closed" : "Online"}
              </p>
            </div>
          )}
          {isNew && (
            <p className="text-xs text-muted-foreground">Start a conversation</p>
          )}
        </div>
      </div>

      {!isClosed && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenTicket}
          className="dark:hover:bg-primary/10 gap-2"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Create Ticket</span>
        </Button>
      )}
    </div>
  );
});

export default ChatHeader;