import { memo, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, History, Plus, XCircle, ArrowLeft } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSocket } from "@/context/SocketContext";
import { useAuthContext } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  const isTyping = useMemo(() => {
    if (!activeChat?._id || !user?._id) return false;
    return Object.keys(typingUsers).some((key) =>
      key.startsWith(`${activeChat._id}:`) && !key.endsWith(user._id)
    );
  }, [typingUsers, activeChat?._id, user?._id]);

  const handleEndChat = useCallback(() => {
    if (!activeChat?._id) return;
    setConfirmTitle("End Chat");
    setConfirmMessage("Are you sure you want to end this conversation? You can view it later in your chat history.");
    setConfirmAction(() => async () => {
      try {
        await endChat(activeChat._id);
        loadUserChats();
      } catch (err) {
        console.error(err);
      }
    });
    setConfirmOpen(true);
  }, [activeChat, endChat, loadUserChats]);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3 bg-card shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground shrink-0 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Bot size={16} className="text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-tight">
              {isNew
                ? "New Chat"
                : isSupportView
                  ? `Chat with ${(activeChat?.user_id as any)?.name || "Customer"}`
                  : (orgSettings?.chatbot_name || "AI Support")}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isClosed ? "bg-muted-foreground/40" : isTyping ? "bg-primary animate-pulse" : "bg-emerald-500"
                }`}
              />
              <p className="text-[11px] text-muted-foreground">
                {isNew
                  ? "Start a conversation"
                  : isClosed
                    ? "Closed"
                    : isTyping
                      ? "Typing..."
                      : "Online"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(isSupportView ? "/support/chat-history" : "/chat-history")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Chat History"
          >
            <History size={15} />
            <span className="hidden sm:inline">Chat History</span>
          </button>

          {!isClosed && activeChat && (
            <button
              type="button"
              onClick={handleEndChat}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              aria-label="End Chat"
            >
              <XCircle size={15} />
              <span className="hidden sm:inline">End Chat</span>
            </button>
          )}

          {!isSupportView && (
            <button
              type="button"
              onClick={() => navigate("/tickets")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Create Ticket"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Create Ticket</span>
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        variant="warning"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </>
  );
});

export default ChatHeader;
