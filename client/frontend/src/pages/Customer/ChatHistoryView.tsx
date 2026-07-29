import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/store";
import { Loader2, AlertCircle } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useChatScroll } from "@/hooks/useChatScroll";
import { setActiveChat, clearError } from "@/store/chatSlice";
import { useSocket } from "@/context/SocketContext";
import { ChatAPI } from "@/api";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";

export default function ChatHistoryView() {
  const { id } = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.user);
  const { socket } = useSocket();

  const {
    activeChat,
    messages,
    messagesLoading,
    sending,
    aiThinking,
    error,
    loadMessages,
    sendWithAI,
    resetMessages,
  } = useChat();

  const { containerRef, handleScroll } = useChatScroll(messages);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await ChatAPI.getById(id);
        if (res.data.success) {
          dispatch(setActiveChat(res.data.data));
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, dispatch]);

  useEffect(() => {
    if (activeChat?._id) {
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

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    if (!activeChat?._id || !user?._id || sending || aiThinking) return;
    try {
      await sendWithAI(activeChat._id, user._id, text);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/80">
        <ChatHeader activeChat={null} />
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/80">
        <ChatHeader activeChat={null} />
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3 text-center px-4">
            <AlertCircle size={32} className="text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">Conversation not found</p>
            <p className="text-xs text-muted-foreground">This chat may have been deleted or you may not have access.</p>
          </div>
        </div>
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
              <p className="text-sm text-muted-foreground">No messages in this conversation.</p>
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
        <ChatInput
          onSend={handleSend}
          disabled={sending || aiThinking}
          chatId={activeChat?._id}
        />
      </div>
    </div>
  );
}
