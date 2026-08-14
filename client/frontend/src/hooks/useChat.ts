import { useCallback, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChatAPI } from "@/api/chat.api.js";
import { MessageAPI } from "@/api/message.api.js";
import { useAuthContext } from "@/context/AuthContext";

export function useChat() {
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
    enabled: loadType !== null,
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
      return res.data?.data || res.data;
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
        // Find chat from chats list if possible, or just set id
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

  return {
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
  };
}
