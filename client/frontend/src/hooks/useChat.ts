import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchChats,
  fetchUserChats,
  createChat,
  closeChat,
  fetchMessages,
  sendMessage,
  sendAndReceiveAI,
  setActiveChat,
  clearMessages,
} from "@/store/chatSlice";
import type { RootState, AppDispatch } from "@/store/store";

export function useChat() {
  const dispatch = useDispatch<AppDispatch>();
  const { chats, activeChat, messages, loading, messagesLoading, sending, aiThinking, error } =
    useSelector((state: RootState) => state.chat);
  const { user } = useSelector((state: RootState) => state.user);

  const loadUserChats = useCallback(() => {
    if (user?._id) {
      dispatch(fetchUserChats(user._id));
    }
  }, [dispatch, user]);

  const loadAllChats = useCallback(
    (params?: Record<string, string>) => {
      dispatch(fetchChats(params));
    },
    [dispatch]
  );

  const startNewChat = useCallback(
    (data: { user_id: string; organization_id: string; topic: string }) => {
      return dispatch(createChat(data)).unwrap();
    },
    [dispatch]
  );

  const endChat = useCallback(
    (chatId: string) => {
      return dispatch(closeChat(chatId));
    },
    [dispatch]
  );

  const loadMessages = useCallback(
    (chatId: string) => {
      return dispatch(fetchMessages(chatId));
    },
    [dispatch]
  );

  const send = useCallback(
    (data: { chat_id: string; sender_id: string; content: string; message_type: string; is_ai: boolean }) => {
      return dispatch(sendMessage(data));
    },
    [dispatch]
  );

  const sendWithAI = useCallback(
    (chatId: string, userId: string, content: string) => {
      return dispatch(sendAndReceiveAI({ chatId, userId, content })).unwrap();
    },
    [dispatch]
  );

  const selectChat = useCallback(
    (chat: any) => {
      dispatch(setActiveChat(chat));
    },
    [dispatch]
  );

  const resetMessages = useCallback(() => {
    dispatch(clearMessages());
  }, [dispatch]);

  return {
    chats,
    activeChat,
    messages,
    loading,
    messagesLoading,
    sending,
    aiThinking,
    error,
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
