import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { Loader2, AlertCircle } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useChatScroll } from "@/hooks/useChatScroll";
import ChatHeader from "@/components/chat/ChatHeader";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ChatLayout from "@/components/chat/ChatLayout";
import ChatSidebar from "@/components/chat/ChatSidebar";
import type { Chat } from "@/types/chat";
import { DocumentAPI } from "@/api";
import { connectSocket, disconnectSocket } from "@/utils/socket";

interface ChatPageProps {
  onOpenTicket?: () => void;
}

export default function ChatPage({ onOpenTicket }: ChatPageProps) {
  const { user } = useSelector((state: RootState) => state.user);
  const [userDocuments, setUserDocuments] = useState<Array<{ _id?: string; title?: string; filename?: string }>>([]);

  const {
    activeChat,
    messages,
    loading,
    messagesLoading,
    sending,
    aiThinking,
    error,
    startNewChat,
    startNewChatViaSocket,
    sendWithStreamViaSocket,
    loadMessages,
    sendWithAIStream,
    loadUserChats,
    selectChat,
    resetMessages,
  } = useChat();

  const { containerRef, handleScroll } = useChatScroll(messages);

  useEffect(() => {
    loadUserChats();
  }, [loadUserChats]);

  useEffect(() => {
    if (user?._id) {
      DocumentAPI.getByUser(user._id)
        .then((res) => {
          const docs = res.data.data || res.data;
          if (Array.isArray(docs)) setUserDocuments(docs);
        })
        .catch(() => {});
    }
  }, [user?._id]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      connectSocket(token);
    }
    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (activeChat?._id) {
      loadMessages(activeChat._id);
    }
  }, [activeChat?._id, loadMessages]);

  const startChatSession = useCallback(
    async (topic: string) => {
      if (!user?._id || !user?.organization_id?._id) return null;
      const result = await startNewChat({
        user_id: user._id,
        organization_id: user.organization_id._id,
        topic,
      });
      const newChat = result.payload;
      if (newChat?._id) {
        selectChat(newChat);
        resetMessages();
        return newChat;
      }
      return null;
    },
    [user, startNewChat, selectChat, resetMessages]
  );

  const handleStartWithMessage = useCallback(
    async (initialMessage: string) => {
      const newChat = await startChatSession(initialMessage.substring(0, 50));
      if (newChat?._id && user?._id) {
        await sendWithAIStream(newChat._id, user._id, initialMessage);
      }
    },
    [startChatSession, user, sendWithAIStream]
  );

  const handleStartWithDocumentViaSocket = useCallback(
    async (initialMessage: string) => {
      if (!user?.organization_id?._id) return;
      const result = await startNewChatViaSocket({
        organization_id: user.organization_id._id,
        topic: initialMessage.substring(0, 50),
      });
      const newChat = result.payload;
      if (newChat?._id) {
        selectChat(newChat);
        resetMessages();
        await sendWithStreamViaSocket(newChat._id, initialMessage);
      }
    },
    [user, startNewChatViaSocket, selectChat, resetMessages, sendWithStreamViaSocket]
  );

  const handleSend = useCallback(
    async (text: string, file?: File) => {
      if (!activeChat?._id || !user?._id) return;

      let finalText = text;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", user._id);
        if (user?.organization_id?._id) {
          formData.append("organization_id", user.organization_id._id);
        }
        try {
          const uploadRes = await DocumentAPI.upload(formData);
          const doc = uploadRes.data.data || uploadRes.data;
          const docId = doc._id || doc.id;
          const docName = doc.title || doc.filename || file.name;
          finalText = text
            ? `${text}\n\n[Attached file: ${docName} (document_id: ${docId})]`
            : `[Attached file: ${docName} (document_id: ${docId})]`;
        } catch {
          finalText = text
            ? `${text}\n\n[Attached file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)]`
            : `[Attached file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)]`;
        }
      }

      await sendWithAIStream(activeChat._id, user._id, finalText);
    },
    [activeChat, user, sendWithAIStream]
  );

  const handleSelectChat = useCallback(
    (chat: Chat) => {
      selectChat(chat);
    },
    [selectChat]
  );

  const handleNewChat = useCallback(async () => {
    await startChatSession("New Chat");
  }, [startChatSession]);

  const sidebar = (
    <ChatSidebar onSelectChat={handleSelectChat} onNewChat={handleNewChat} />
  );

  if (!activeChat && !loading) {
    return (
      <ChatLayout sidebar={sidebar}>
        <ChatHeader activeChat={null} onOpenTicket={onOpenTicket ?? (() => {})} />
        <WelcomeScreen
          onStartWithMessage={handleStartWithMessage}
          onStartWithDocument={handleStartWithDocumentViaSocket}
          onOpenTicket={onOpenTicket ?? (() => {})}
          documents={userDocuments}
        />
      </ChatLayout>
    );
  }

  return (
    <ChatLayout sidebar={sidebar}>
      <ChatHeader activeChat={activeChat} onOpenTicket={onOpenTicket ?? (() => {})} />

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
            <p className="text-sm text-muted-foreground">Say hello to the AI assistant!</p>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg) => (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChatMessage
                  message={msg}
                  isOwn={!msg.is_ai && msg.sender_id === user?._id}
                />
              </motion.div>
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
    </ChatLayout>
  );
}
