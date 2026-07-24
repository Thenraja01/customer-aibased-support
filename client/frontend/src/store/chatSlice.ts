  import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
  import { ChatAPI } from "@/api/chat.api";
  import { MessageAPI } from "@/api/message.api";

  export const fetchChats = createAsyncThunk(
    "chat/fetchChats",
    async (params: Record<string, string> | undefined, { rejectWithValue }) => {
      try {
        const res = await ChatAPI.getAll(params);
        return res.data.data;
      } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch chats");
      }
    }
  );

  export const fetchUserChats = createAsyncThunk(
    "chat/fetchUserChats",
    async (userId: string, { rejectWithValue }) => {
      try {
        const res = await ChatAPI.getByUser(userId);
        return res.data.data;
      } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch user chats");
      }
    }
  );

  export const createChat = createAsyncThunk(
    "chat/createChat",
    async (data: { user_id: string; organization_id: string; topic: string }, { rejectWithValue }) => {
      try {
        const res = await ChatAPI.create(data);
        return res.data.data;
      } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || "Failed to create chat");
      }
    }
  );

  export const closeChat = createAsyncThunk(
    "chat/closeChat",
    async (chatId: string, { rejectWithValue }) => {
      try {
        await ChatAPI.close(chatId);
        return chatId;
      } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || "Failed to close chat");
      }
    }
  );

  export const fetchMessages = createAsyncThunk(
    "chat/fetchMessages",
    async (chatId: string, { rejectWithValue }) => {
      try {
        const res = await MessageAPI.getByChat(chatId);
        return { chatId, messages: res.data.data };
      } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch messages");
      }
    }
  );

  export const sendMessage = createAsyncThunk(
    "chat/sendMessage",
    async (data: { chat_id: string; sender_id: string; content: string; message_type: string; is_ai: boolean }, { rejectWithValue }) => {
      try {
        const res = await MessageAPI.send(data);
        return res.data.data;
      } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || "Failed to send message");
      }
    }
  );

  export const sendAndReceiveAI = createAsyncThunk(
    "chat/sendAndReceiveAI",
    async (
      { chatId, userId, content }: { chatId: string; userId: string; content: string },
      { dispatch, rejectWithValue }
    ) => {
      try {
        await dispatch(
          sendMessage({
            chat_id: chatId,
            sender_id: userId,
            content,
            message_type: "text",
            is_ai: false,
          })
        ).unwrap();

        const res = await ChatAPI.sendAI(chatId, content);
        return res.data.data;
      } catch (err: any) {
        return rejectWithValue(err.response?.data?.message || "Failed to get AI response");
      }
    }
  );

  interface ChatState {
    chats: any[];
    activeChat: any;
    messages: any[];
    loading: boolean;
    messagesLoading: boolean;
    sending: boolean;
    aiThinking: boolean;
    error: string | null;
  }

  const initialState: ChatState = {
    chats: [],
    activeChat: null,
    messages: [],
    loading: false,
    messagesLoading: false,
    sending: false,
    aiThinking: false,
    error: null,
  };

  const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
      setActiveChat: (state, action) => {
        state.activeChat = action.payload;
      },
      clearMessages: (state) => {
        state.messages = [];
      },
      addMessage: (state, action) => {
        state.messages.push(action.payload);
      },
      clearError: (state) => {
        state.error = null;
      },
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchChats.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchChats.fulfilled, (state, action) => {
          state.loading = false;
          state.chats = action.payload;
        })
        .addCase(fetchChats.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        })
        .addCase(fetchUserChats.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchUserChats.fulfilled, (state, action) => {
          state.loading = false;
          state.chats = action.payload;
        })
        .addCase(fetchUserChats.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        })
        .addCase(createChat.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(createChat.fulfilled, (state, action) => {
          state.loading = false;
          state.chats.unshift(action.payload);
          state.activeChat = action.payload;
          state.messages = [];
        })
        .addCase(createChat.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        })
        .addCase(closeChat.fulfilled, (state, action) => {
          const chat = state.chats.find((c) => c._id === action.payload);
          if (chat) chat.status = "closed";
          if (state.activeChat?._id === action.payload) {
            state.activeChat.status = "closed";
          }
        })
        .addCase(fetchMessages.pending, (state) => {
          state.messagesLoading = true;
        })
        .addCase(fetchMessages.fulfilled, (state, action) => {
          state.messagesLoading = false;
          state.messages = action.payload.messages;
        })
        .addCase(fetchMessages.rejected, (state, action) => {
          state.messagesLoading = false;
          state.error = action.payload as string;
        })
        .addCase(sendMessage.pending, (state) => {
          state.sending = true;
        })
        .addCase(sendMessage.fulfilled, (state, action) => {
          state.sending = false;
          state.messages.push(action.payload);
        })
        .addCase(sendMessage.rejected, (state, action) => {
          state.sending = false;
          state.error = action.payload as string;
        })
        .addCase(sendAndReceiveAI.pending, (state) => {
          state.aiThinking = true;
        })
        .addCase(sendAndReceiveAI.fulfilled, (state, action) => {
          state.aiThinking = false;
          state.messages.push(action.payload);
        })
        .addCase(sendAndReceiveAI.rejected, (state, action) => {
          state.aiThinking = false;
          state.error = action.payload as string;
        });
    },
  });

  export const { setActiveChat, clearMessages, addMessage, clearError } = chatSlice.actions;
  export default chatSlice.reducer;
