import { useEffect, useCallback, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import type { RootState, AppDispatch } from "@/store/store";
import { Loader2, AlertCircle, TicketCheck } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { clearError } from "@/store/chatSlice";
import { useSocket } from "@/context/SocketContext";
import { TicketAPI, ChatAPI } from "@/api";
import ChatHeader from "@/components/chat/ChatHeader";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
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
    selectChat,
  } = useChat();

  const toast = useToast();
  const isCreatingRef = useRef(false);
  const isMountedRef = useRef(true);
  const { containerRef, handleScroll } = useAutoScroll(messages);
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Check if we have a chatId from state or URL
  const chatId = location.state?.chatId || new URLSearchParams(location.search).get('id');

  // Load chats on mount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    loadUserChats();
  }, [user?._id, loadUserChats]);

  // Handle chat selection from URL/state
  useEffect(() => {
    if (!user?._id) return;

    const loadSpecificChat = async () => {
      if (chatId) {
        // Load existing chat
        try {
          await loadMessages(chatId);
          // The activeChat should be set by loadMessages or we need to find it
        } catch (error) {
          console.error("Failed to load chat:", error);
          toast.error("Error", "Failed to load chat");
          navigate("/chat", { replace: true });
        }
      } else {
        // New chat - clear any existing messages
        resetMessages();
        selectChat(null);
      }
      setIsInitialLoad(false);
    };

    loadSpecificChat();
  }, [chatId, user?._id, loadMessages, resetMessages, selectChat, navigate]);

  // Socket join/leave
  useEffect(() => {
    if (activeChat?._id && socket) {
      socket.emit("join:chat", activeChat._id);
      return () => {
        socket.emit("leave:chat", activeChat._id);
      };
    }
  }, [activeChat?._id, socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetMessages();
    };
  }, [resetMessages]);

  // Error timeout
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
        toast.error("Error", "Unable to start chat");
        return;
      }

      if (isCreatingRef.current) return;
      isCreatingRef.current = true;

      try {
        const chat = await startNewChat({
          user_id: user._id,
          organization_id: user.organization_id._id,
          topic: initialMessage.substring(0, 50),
        });

        if (chat?._id) {
          // Navigate to the same route with chatId in state
          navigate("/chat", { 
            state: { chatId: chat._id },
            replace: true 
          });
          
          // Send the message
          await sendWithAI(chat._id, user._id, initialMessage);
        }
      } catch (err) {
        console.error("handleStartWithMessage error:", err);
        toast.error("Error", "Failed to start chat");
      } finally {
        isCreatingRef.current = false;
      }
    },
    [user, startNewChat, sendWithAI, navigate]
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      if (!activeChat?._id || !user?._id || sending || aiThinking) {
        toast.warning("Warning", "Please wait for the current message to complete");
        return;
      }

      try {
        await sendWithAI(activeChat._id, user._id, text);
      } catch (error) {
        console.error("Send error:", error);
        toast.error("Error", "Failed to send message");
      }
    },
    [activeChat, user, sending, aiThinking, sendWithAI]
  );

  const handleEscalate = useCallback(async () => {
    if (!activeChat?._id || escalating || activeChat.status === "closed") {
      return;
    }

    setEscalating(true);
    try {
      await TicketAPI.escalateFromChat({ chatId: activeChat._id });
      setEscalated(true);
      toast.success("Success", "Chat escalated to ticket");
    } catch (error) {
      console.error("Escalate error:", error);
      toast.error("Error", "Failed to escalate chat");
    } finally {
      setEscalating(false);
    }
  }, [activeChat, escalating]);

  const handleEndChat = useCallback(async () => {
    if (!activeChat?._id) return;

    try {
      await ChatAPI.close(activeChat._id);
      toast.success("Success", "Chat ended successfully");
      // Navigate to new chat
      navigate("/chat", { replace: true });
      loadUserChats();
    } catch (err) {
      console.error("End chat error:", err);
      toast.error("Error", "Failed to end chat");
    }
  }, [activeChat, loadUserChats, navigate]);

  const handleBack = useCallback(() => {
    navigate("/chat", { replace: true });
  }, [navigate]);

  // Show welcome screen if no active chat and not loading
  if (!activeChat && !loading && !messagesLoading && !chatId) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/80">
        <ChatHeader 
          activeChat={null} 
          onBack={handleBack}
        />
        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive dark:bg-destructive/15 max-w-3xl self-center w-full">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        <WelcomeScreen onStartWithMessage={handleStartWithMessage} />
      </div>
    );
  }

  // Show loading state
  if ((loading || messagesLoading) && isInitialLoad) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/80">
      <ChatHeader 
        activeChat={activeChat} 
        onBack={chatId ? handleBack : undefined}
      />

      {error && (
        <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive dark:bg-destructive/15 max-w-3xl self-center w-full">
          <AlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {messagesLoading && !isInitialLoad ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
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
              type="button"
              onClick={handleEscalate}
              disabled={escalating || escalated || activeChat.status === "closed"}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {escalating ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <TicketCheck size={14} aria-hidden="true" />
              )}
              {escalated ? "Escalated to Ticket" : "Escalate to Ticket"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={activeChat.status === "closed"}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              End Chat
            </button>
          </div>
        )}
        <ChatInput
          onSend={handleSend}
          disabled={sending || aiThinking || loading || !activeChat}
          chatId={activeChat?._id}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleEndChat}
        title="End Chat"
        message="Are you sure you want to end this chat? This action cannot be undone."
        confirmLabel="End Chat"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}