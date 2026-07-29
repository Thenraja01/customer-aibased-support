import { memo, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, MessageCircle, Plus, XCircle, History, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSocket } from "@/context/SocketContext";
import { useAuthContext } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
import { ChatAPI } from "@/api";
import type { Chat } from "@/types/chat";

interface ChatHeaderProps {
  activeChat: Chat | null;
  isSupportView?: boolean;
  onBack?: () => void;
}

const ChatHeader = memo(function ChatHeader({ activeChat, isSupportView, onBack }: ChatHeaderProps) {
  const navigate = useNavigate();
  const { user, orgSettings } = useAuthContext();
  const { typingUsers } = useSocket();
  const { endChat, loadUserChats } = useChat();
  const isNew = !activeChat;
  const isClosed = activeChat?.status === "closed";
  const [endingAll, setEndingAll] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const isTyping = useMemo(() => {
    if (!activeChat?._id || !user?._id) return false;
    return Object.keys(typingUsers).some((key) =>
      key.startsWith(`${activeChat._id}:`) && !key.endsWith(user._id)
    );
  }, [typingUsers, activeChat?._id, user?._id]);

  const handleEndAll = useCallback(async () => {
    setConfirmAction(() => async () => {
      setEndingAll(true);
      try {
        await ChatAPI.closeAll();
        loadUserChats();
      } catch (err) {
        console.error(err);
      } finally {
        setEndingAll(false);
      }
    });
    setConfirmOpen(true);
  }, [loadUserChats]);

  return (
    <>
      <div className="flex items-center justify-between border-b dark:border-white/[0.06] px-6 py-4 bg-background/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm shadow-primary/20">
            {isNew ? (
              <MessageCircle size={15} className="text-primary-foreground" />
            ) : (
              <Headphones size={15} className="text-primary-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold">
              {isNew ? "New Chat" : isSupportView ? `Chat with ${(activeChat?.user_id as any)?.name || "Customer"}` : (orgSettings?.chatbot_name || "Support Chat")}
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

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(isSupportView ? "/support/chat-history" : "/chat-history")}
            className="gap-2"
          >
            <History size={16} />
            <span className="hidden sm:inline">Chat History</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEndAll}
            disabled={endingAll}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
          >
            {endingAll ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
            <span className="hidden sm:inline">End All Chats</span>
          </Button>
          {!isClosed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => activeChat?._id && endChat(activeChat._id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
            >
              <XCircle size={16} />
              <span className="hidden sm:inline">End Chat</span>
            </Button>
          )}
          {!isSupportView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/tickets")}
              className="dark:hover:bg-primary/10 gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Create Ticket</span>
            </Button>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="End All Chats"
        message="Are you sure you want to end all active chats?"
        variant="warning"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </>
  );
});

export default ChatHeader;
