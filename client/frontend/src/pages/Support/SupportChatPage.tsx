import { useEffect, useCallback, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import { Loader2, AlertCircle } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useChatScroll } from "@/hooks/useChatScroll";
import { setActiveChat, clearError } from "@/store/chatSlice";
import { useSocket } from "@/context/SocketContext";
import ChatHeader from "@/components/chat/ChatHeader";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndigator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChatAPI } from "@/api";

export default function SupportChatPage() {
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    dispatch(setActiveChat(null));
    resetMessages();
    if (user?._id) {
      loadUserChats();
    }
  }, [user?._id, dispatch, resetMessages, loadUserChats]);

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
        return;
      }
      isCreatingRef.current = true;
      try {
        const chat = await startNewChat({
          user_id: user._id,
          organization_id: user.organization_id._id,
          topic: initialMessage.substring(0, 50),
        });
        await sendWithAI(chat._id, user._id, initialMessage);
        loadUserChats();
      } catch (err) {
        console.error(err);
      } finally {
        isCreatingRef.current = false;
      }
    },
    [user, startNewChat, sendWithAI, loadUserChats]
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

  const handleEndChat = useCallback(async () => {
    if (!activeChat?._id) return;
    setConfirmAction(() => async () => {
      try {
        await ChatAPI.close(activeChat._id);
        loadUserChats();
      } catch (err) {
        console.error(err);
      }
    });
    setConfirmOpen(true);
  }, [activeChat, loadUserChats]);

  if (!activeChat && !loading) {
    return (
      <>
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/80">
          <ChatHeader activeChat={null} isSupportView />
          {error && (
            <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive dark:bg-destructive/15 max-w-3xl self-center w-full">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          <WelcomeScreen onStartWithMessage={handleStartWithMessage} />
        </div>
        <ConfirmDialog
          open={confirmOpen}
          title="End Chat"
          message="Are you sure you want to end this chat?"
          variant="warning"
          onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
          onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/80">
        <ChatHeader activeChat={activeChat} isSupportView />

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
                  isOwn={msg.sender_id === user?._id}
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
      <ConfirmDialog
        open={confirmOpen}
        title="End Chat"
        message="Are you sure you want to end this chat?"
        variant="warning"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </>
  );
}
