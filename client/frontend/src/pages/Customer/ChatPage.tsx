import { useEffect, useCallback, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import { Loader2, AlertCircle, TicketCheck } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useChatScroll } from "@/hooks/useChatScroll";
import { clearError } from "@/store/chatSlice";
import { useSocket } from "@/context/SocketContext";
import { TicketAPI, ChatAPI } from "@/api";
import ChatHeader from "@/components/chat/ChatHeader";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndigator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function ChatPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.user);
  const { socket } = useSocket();

  const {
    activeChat,
    messages,
    loading,
    messagesLoading,
    sending,
    aiThinking,
    error,
    loadUserChats,
    startNewChat,
    loadMessages,
    sendWithAI,
    resetMessages,
  } = useChat();

  const isCreatingRef = useRef(false);
  const { containerRef, handleScroll } = useChatScroll(messages);
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!user?._id) return;
    loadUserChats();
  }, [user?._id, loadUserChats]);

  useEffect(() => {
    if (activeChat?._id && !isCreatingRef.current) {
      loadMessages(activeChat._id);
    }
  }, [activeChat?._id, loadMessages]);

  useEffect(() => {
    if (activeChat?._id && socket) {
      socket.emit("join:chat", activeChat._id);
      return () => {
        socket.emit("leave:chat", activeChat._id);
      };
    }
  }, [activeChat?._id, socket]);

  useEffect(() => {
    return () => {
      resetMessages();
    };
  }, [resetMessages]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(t);
    }
  }, [error, dispatch]);

  const handleStartWithMessage = useCallback(
    async (initialMessage: string) => {
      if (!user?._id || !user?.organization_id?._id) {
        console.warn("handleStartWithMessage: missing user or org", user);
        return;
      }
      isCreatingRef.current = true;
      try {
        const chat = await startNewChat({
          user_id: user._id,
          organization_id: user.organization_id._id,
          topic: initialMessage.substring(0, 50),
        });
        console.log("Chat created:", chat);
        await sendWithAI(chat._id, user._id, initialMessage);
      } catch (err) {
        console.error("handleStartWithMessage error:", err);
      } finally {
        isCreatingRef.current = false;
      }
    },
    [user, startNewChat, sendWithAI]
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      if (!activeChat?._id || !user?._id || sending || aiThinking) return;

      try {
        await sendWithAI(activeChat._id, user._id, text);
      } catch (error) {
        console.error(error);
      }
    },
    [activeChat, user, sending, aiThinking, sendWithAI]
  );

  const handleEscalate = useCallback(async () => {
    if (!activeChat?._id || escalating) return;
    setEscalating(true);
    try {
      await TicketAPI.escalateFromChat({ chatId: activeChat._id });
      setEscalated(true);
    } catch {
      // silent
    } finally {
      setEscalating(false);
    }
  }, [activeChat, escalating]);

  const handleEndChat = useCallback(async () => {
    if (!activeChat?._id) return;
    if (!confirm("Are you sure you want to end this chat?")) return;
    try {
      await ChatAPI.close(activeChat._id);
      loadUserChats();
    } catch (err) {
      console.error(err);
    }
  }, [activeChat, loadUserChats]);

  if (!activeChat && !loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/80">
        <ChatHeader activeChat={null} />
        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive dark:bg-destructive/15 max-w-3xl self-center w-full">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
        <WelcomeScreen onStartWithMessage={handleStartWithMessage} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/80">
      <ChatHeader activeChat={activeChat} />

      {error && (
        <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive dark:bg-destructive/15 max-w-3xl self-center w-full">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            {sending || aiThinking ? (
              <TypingIndicator />
            ) : (
              <p className="text-sm text-muted-foreground">Say hello to the AI assistant!</p>
            )}
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg) => (
              <ChatMessage
                key={msg._id}
                message={msg}
                isOwn={!msg.is_ai && msg.sender_id === user?._id}
              />
            ))}
            {(sending || aiThinking) && <TypingIndicator />}
          </div>
        )}
      </div>

      <div className="border-t bg-white bg-background/80 backdrop-blur-xl shrink-0">
        {activeChat && messages.length > 0 && (
          <div className="px-4 py-2 border-b flex gap-2">
            <button
              onClick={handleEscalate}
              disabled={escalating || escalated || activeChat.status === "closed"}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
            >
              {escalating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <TicketCheck size={14} />
              )}
              {escalated ? "Escalated to Ticket" : "Escalate to Ticket"}
            </button>
            <button
              onClick={handleEndChat}
              disabled={activeChat.status === "closed"}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
            >
              End Chat
            </button>
          </div>
        )}
        <ChatInput
          onSend={handleSend}
          disabled={sending || aiThinking || loading}
          chatId={activeChat?._id}
        />
      </div>
    </div>
  );
}
