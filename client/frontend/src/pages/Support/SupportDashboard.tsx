import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/store/store";
import { Search, Loader2, AlertCircle, Database, FileText, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useChatScroll } from "@/hooks/useChatScroll";
import { clearError } from "@/store/chatSlice";
import ChatHeader from "@/components/chat/ChatHeader";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndigator";
import { MessageSquare, FileText as FileTextIcon } from "lucide-react";
import DocumentAPI from "@/api/document.api.js";

type RAGResult = {
  _id: string;
  document_id: string;
  content: string;
  score: number;
  assigned_role: string;
  title?: string;
  chunk_index?: number;
};

export default function SupportDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);
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

  const [ragEnabled, setRagEnabled] = useState(true);
  const [documentsEnabled, setDocumentsEnabled] = useState(true);
  const [availableDocs, setAvailableDocs] = useState<any[]>([]);
  const [ragResults, setRagResults] = useState<RAGResult[]>([]);
  const [showDocsPanel, setShowDocsPanel] = useState(false);
  const [isCreatingRef, setIsCreatingRef] = useState(false);
  const { containerRef, handleScroll } = useChatScroll(messages);

  useEffect(() => {
    if (!user?._id) return;
    loadUserChats();
  }, [user?._id, loadUserChats]);

  useEffect(() => {
    if (activeChat?._id && !isCreatingRef) {
      loadMessages(activeChat._id);
    }
  }, [activeChat?._id, loadMessages, isCreatingRef]);

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

  const fetchAvailableDocs = useCallback(async () => {
    try {
      const response = await DocumentAPI.getByUser(user?._id);
      setAvailableDocs(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }, [user?._id]);

  useEffect(() => {
    if (documentsEnabled) {
      fetchAvailableDocs();
    }
  }, [documentsEnabled, fetchAvailableDocs]);

  const handleStartWithMessage = useCallback(
    async (initialMessage: string) => {
      if (!user?._id || !user?.organization_id?._id) {
        console.warn("handleStartWithMessage: missing user or org", user);
        return;
      }
      setIsCreatingRef(true);
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
        setIsCreatingRef(false);
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
        <ChatInput
          onSend={handleSend}
          disabled={sending || aiThinking || loading}
        />
      </div>
    </div>
  );
}
