import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, MessageCircle, Plus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/context/SocketContext";
import { useAuthContext } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
import type { Chat } from "@/types/chat";

interface ChatHeaderProps {
  activeChat: Chat | null;
  isSupportView?: boolean;
}

const ChatHeader = memo(function ChatHeader({ activeChat, isSupportView }: ChatHeaderProps) {
  const navigate = useNavigate();
  const { user, orgSettings } = useAuthContext();
  const { typingUsers } = useSocket();
  const { endChat } = useChat();
  const isNew = !activeChat;
  const isClosed = activeChat?.status === "closed";

  const isTyping = useMemo(() => {
    if (!activeChat?._id || !user?._id) return false;
    return Object.keys(typingUsers).some((key) =>
      key.startsWith(`${activeChat._id}:`) && !key.endsWith(user._id)
    );
  }, [typingUsers, activeChat?._id, user?._id]);

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
            {isNew ? "New Chat" : isSupportView ? `Chat with ${activeChat?.user_id?.name || "Customer"}` : (orgSettings?.chatbot_name || "Support Chat")}
          </h2>
          {!isNew && (
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isClosed ? "bg-muted" : isTyping ? "bg-primary animate-pulse" : "bg-green-500"
                }`}
              />
              <p className="text-xs text-muted-foreground">
                {isClosed ? "Closed" : isTyping ? "Typing..." : "Online"}
              </p>
            </div>
          )}
          {isNew && (
            <p className="text-xs text-muted-foreground">Start a conversation</p>
          )}
        </div>
      </div>

      {!isClosed && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => activeChat?._id && endChat(activeChat._id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
          >
            <XCircle size={16} />
            <span className="hidden sm:inline">End Chat</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/tickets")}
            className="dark:hover:bg-primary/10 gap-2"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Create Ticket</span>
          </Button>
        </div>
      )}
    </div>
  );
});

export default ChatHeader;
