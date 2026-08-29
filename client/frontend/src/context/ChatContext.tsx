import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatAPI } from "@/api/chat.api.js";
import { MessageAPI } from "@/api/message.api.js";
import { useAuthContext } from "@/context/AuthContext";

interface ChatContextType {
  chats: any[];
  activeChat: any;
  messages: any[];
  sortedMessages: any[];
  pendingMessages: any[];
  loading: boolean;
  messagesLoading: boolean;
  sending: boolean;
  aiThinking: boolean;
  error: string | null;
  loadUserChats: () => void;
  loadAllChats: (params?: Record<string, string>) => void;
  startNewChat: (data: { user_id: string; organization_id: string; topic: string }) => Promise<any>;
  endChat: (chatId: string) => Promise<any>;
  loadMessages: (chatId: string) => void;
  send: (data: { chat_id: string; sender_id: string; content: string; message_type: string; is_ai: boolean }) => Promise<any>;
  sendWithAI: (chatId: string, userId: string, content: string) => Promise<any>;
  selectChat: (chat: any) => void;
  resetMessages: () => void;
  renameChat: (chatId: string, topic: string) => Promise<any>;
  deleteChat: (chatId: string) => Promise<any>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  
  const [activeChat, setActiveChatState] = useState<any>(null);
  const [params, setParams] = useState<Record<string, string> | undefined>(undefined);
  const [loadType, setLoadType] = useState<"user" | "all" | null>(null);

  const { data: chatsData, isLoading: chatsLoading, error: chatsError } = useQuery({
    queryKey: ["chats", loadType, user?._id, params],
    queryFn: async () => {
      if (loadType === "user" && user?._id) {
        const res = await ChatAPI.getByUser(user._id);
        return res.data?.data || res.data;
      } else if (loadType === "all") {
        const res = await ChatAPI.getAll(params);
        return res.data?.data || res.data;
      }
      return [];
    },
    enabled: loadType !== null && !!user?._id,
  });

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", activeChat?._id],
    queryFn: async () => {
      if (!activeChat?._id) return [];
      const res = await MessageAPI.getByChat(activeChat._id);
      return res.data?.data || res.data || [];
    },
    enabled: !!activeChat?._id,
  });

  const createChatMutation = useMutation({
    mutationFn: (data: any) => ChatAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const closeChatMutation = useMutation({
    mutationFn: (chatId: string) => ChatAPI.close(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => MessageAPI.send(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.chat_id] });
    },
  });

  const sendAIMutation = useMutation({
    mutationFn: (data: { chatId: string; message: string }) => ChatAPI.sendAI(data.chatId, data.message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.chatId] });
    },
  });
  
  const renameChatMutation = useMutation({
    mutationFn: (data: { chatId: string; topic: string }) => ChatAPI.updateTopic(data.chatId, { topic: data.topic }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
  
  const deleteChatMutation = useMutation({
    mutationFn: (chatId: string) => ChatAPI.delete(chatId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      if (activeChat?._id === deletedId) {
        setActiveChatState(null);
      }
    },
  });

  const messages = messagesData || [];
  
  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [messages]);

  const pendingMessages = useMemo(() => {
    return messages.filter((m: any) => m.status === "pending" || m.status === "sending");
  }, [messages]);

  const loadUserChats = useCallback(() => {
    setLoadType("user");
  }, []);

  const loadAllChats = useCallback(
    (newParams?: Record<string, string>) => {
      setParams(newParams);
      setLoadType("all");
    },
    []
  );

  const startNewChat = useCallback(
    async (data: { user_id: string; organization_id: string; topic: string }) => {
      const res = await createChatMutation.mutateAsync(data);
      const newChat = res.data?.data || res.data;
      setActiveChatState(newChat);
      return newChat;
    },
    [createChatMutation]
  );

  const endChat = useCallback(
    async (chatId: string) => {
      return closeChatMutation.mutateAsync(chatId);
    },
    [closeChatMutation]
  );

  const loadMessages = useCallback(
    (chatId: string) => {
      if (activeChat?._id !== chatId) {
        const chatObj = chatsData?.find((c: any) => c._id === chatId) || { _id: chatId };
        setActiveChatState(chatObj);
      }
    },
    [activeChat, chatsData]
  );

  const send = useCallback(
    async (data: { chat_id: string; sender_id: string; content: string; message_type: string; is_ai: boolean }) => {
      return sendMessageMutation.mutateAsync(data);
    },
    [sendMessageMutation]
  );

  const sendWithAI = useCallback(
    async (chatId: string, _userId: string, content: string) => {
      return sendAIMutation.mutateAsync({ chatId, message: content });
    },
    [sendAIMutation]
  );

  const selectChat = useCallback(
    (chat: any) => {
      setActiveChatState(chat);
    },
    []
  );

  const resetMessages = useCallback(() => {
    setActiveChatState(null);
  }, []);
  
  const renameChat = useCallback(
    async (chatId: string, topic: string) => {
      return renameChatMutation.mutateAsync({ chatId, topic });
    },
    [renameChatMutation]
  );
  
  const deleteChat = useCallback(
    async (chatId: string) => {
      return deleteChatMutation.mutateAsync(chatId);
    },
    [deleteChatMutation]
  );

  return (
    <ChatContext.Provider
      value={{
        chats: chatsData || [],
        activeChat,
        messages,
        sortedMessages,
        pendingMessages,
        loading: chatsLoading,
        messagesLoading,
        sending: sendMessageMutation.isPending,
        aiThinking: sendAIMutation.isPending,
        error: chatsError ? (chatsError as Error).message : null,
        loadUserChats,
        loadAllChats,
        startNewChat,
        endChat,
        loadMessages,
        send,
        sendWithAI,
        selectChat,
        resetMessages,
        renameChat,
        deleteChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useGlobalChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useGlobalChat must be used within a ChatProvider");
  }
  return context;
}
