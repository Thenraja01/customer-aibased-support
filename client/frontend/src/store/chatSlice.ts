import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ChatAPI } from "@/api/chat.api";
import { MessageAPI } from "@/api/message.api";
import { getSocket } from "@/utils/socket";

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

let streamingMessageId = 0;

let socketStreamingId = 0;

export const createChatViaSocket = createAsyncThunk(
  "chat/createChatViaSocket",
  async (
    data: { organization_id: string; topic: string },
    { rejectWithValue }
  ) => {
    const sock = getSocket();
    if (!sock) return rejectWithValue("Socket not connected");

    return new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject("Chat creation timeout"), 15000);

      sock!.emit("chat:create", data, (ack: { success: boolean; data?: any; message?: string }) => {
        clearTimeout(timeout);
        if (ack.success) {
          resolve(ack.data);
        } else {
          reject(ack.message || "Failed to create chat via socket");
        }
      });
    });
  }
);

export const sendAndReceiveStreamViaSocket = createAsyncThunk(
  "chat/sendAndReceiveStreamViaSocket",
  async (
    { chatId, content }: { chatId: string; content: string },
    { dispatch, rejectWithValue }
  ) => {
    const sock = getSocket();
    if (!sock) return rejectWithValue("Socket not connected");

    const tempId = `socket-streaming-${++socketStreamingId}`;

    dispatch(addStreamingMessage({
      _id: tempId,
      chat_id: chatId,
      content: "",
      is_ai: true,
      created_at: new Date().toISOString(),
    }));

    return await new Promise<{ _id: string; finalized: boolean }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject("Stream timeout");
      }, 60000);

      let userMessageId: string | null = null;

      const onUserMessage = (data: { data: any }) => {
        const msg = data.data || data;
        userMessageId = msg._id;
        dispatch(insertUserMessage(msg));
      };

      const onToken = (data: { content: string }) => {
        dispatch(appendStreamToken({ id: tempId, token: data.content }));
      };

      const onDone = (data: { meta?: any; fullContent?: string }) => {
        clearTimeout(timeout);
        cleanup();
        dispatch(finalizeStreamingMessage({ id: tempId, meta: data.meta || {}, chatId }));
        resolve({ _id: tempId, finalized: true });
      };

      const onError = (data: { message: string }) => {
        clearTimeout(timeout);
        cleanup();
        dispatch(removeStreamingMessage({ id: tempId }));
        reject(data.message || "Stream error");
      };

      function cleanup() {
        sock!.off("chat:user-message", onUserMessage);
        sock!.off("chat:token", onToken);
        sock!.off("chat:done", onDone);
        sock!.off("error", onError);
      }

      sock!.on("chat:user-message", onUserMessage);
      sock!.on("chat:token", onToken);
      sock!.on("chat:done", onDone);
      sock!.on("error", onError);

      sock!.emit("chat:stream", { chatId, message: content });
    });
  }
);

export const sendAndReceiveAIStream = createAsyncThunk(
  "chat/sendAndReceiveAIStream",
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

      const tempId = `streaming-${++streamingMessageId}`;

      dispatch(addStreamingMessage({
        _id: tempId,
        chat_id: chatId,
        content: "",
        is_ai: true,
        created_at: new Date().toISOString(),
      }));

      return await new Promise<{ _id: string; finalized: boolean }>((resolve, reject) => {
        ChatAPI.streamAI(
          chatId,
          content,
          (token: string) => {
            dispatch(appendStreamToken({ id: tempId, token }));
          },
          (meta: any) => {
            dispatch(finalizeStreamingMessage({ id: tempId, meta, chatId }));
            resolve({ _id: tempId, finalized: true });
          },
          (error: string) => {
            dispatch(removeStreamingMessage({ id: tempId }));
            reject(error);
          }
        );
      });
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err || "Failed to get AI response");
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
  streamingMessageId: string | null;
  streamingContent: string;
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
  streamingMessageId: null,
  streamingContent: "",
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
    insertUserMessage: (state, action) => {
      const streamIdx = state.messages.findIndex((m) => m._streaming);
      const msg = { ...action.payload, is_ai: false };
      if (streamIdx !== -1) {
        state.messages.splice(streamIdx, 0, msg);
      } else {
        state.messages.push(msg);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    addStreamingMessage: (state, action) => {
      state.streamingMessageId = action.payload._id;
      state.streamingContent = "";
      state.messages.push({ ...action.payload, _streaming: true });
    },
    appendStreamToken: (state, action) => {
      const { id, token } = action.payload;
      state.streamingContent += token;
      const idx = state.messages.findIndex((m) => m._id === id);
      if (idx !== -1) {
        state.messages[idx] = {
          ...state.messages[idx],
          content: state.streamingContent,
        };
      }
    },
    finalizeStreamingMessage: (state, action) => {
      const { id, meta, chatId } = action.payload;
      state.streamingMessageId = null;
      state.streamingContent = "";
      const idx = state.messages.findIndex((m) => m._id === id);
      if (idx !== -1) {
        state.messages[idx] = {
          ...state.messages[idx],
          _streaming: false,
          _ragChunksUsed: meta?.ragChunksUsed,
          _intent: meta?.intent,
          _model: meta?.model,
        };
      }
      if (meta?.title) {
        const chatIdx = state.chats.findIndex((c) => c._id === chatId);
        if (chatIdx !== -1) {
          state.chats[chatIdx] = { ...state.chats[chatIdx], topic: meta.title };
        }
        if (state.activeChat?._id === chatId) {
          state.activeChat = { ...state.activeChat, topic: meta.title };
        }
      }
    },
    removeStreamingMessage: (state, action) => {
      const { id } = action.payload;
      state.streamingMessageId = null;
      state.streamingContent = "";
      state.messages = state.messages.filter((m) => m._id !== id);
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
      })
      .addCase(createChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createChatViaSocket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChatViaSocket.fulfilled, (state, action) => {
        state.loading = false;
        state.chats.unshift(action.payload);
        state.activeChat = action.payload;
      })
      .addCase(createChatViaSocket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(sendAndReceiveStreamViaSocket.pending, (state) => {
        state.aiThinking = true;
        state.error = null;
      })
      .addCase(sendAndReceiveStreamViaSocket.fulfilled, (state) => {
        state.aiThinking = false;
      })
      .addCase(sendAndReceiveStreamViaSocket.rejected, (state, action) => {
        state.aiThinking = false;
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
      })
      .addCase(sendAndReceiveAIStream.pending, (state) => {
        state.aiThinking = true;
        state.error = null;
      })
      .addCase(sendAndReceiveAIStream.fulfilled, (state) => {
        state.aiThinking = false;
      })
      .addCase(sendAndReceiveAIStream.rejected, (state, action) => {
        state.aiThinking = false;
        state.error = action.payload as string;
      });
  },
});

export const { setActiveChat, clearMessages, addMessage, insertUserMessage, clearError, addStreamingMessage, appendStreamToken, finalizeStreamingMessage, removeStreamingMessage } = chatSlice.actions;
export default chatSlice.reducer;
