import axiosInstance from "./axiosInstance";

export interface AIConversationItem {
  _id: string;
  title: string;
  mode: string;
  model: string;
  is_pinned?: boolean;
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AISourceItem {
  id: string;
  title: string;
  type?: string;
  chunk_id?: string;
  document_id?: string;
  relevance?: number;
  entities?: string[];
}

export interface AIToolCallItem {
  action_id: string;
  tool: string;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: string;
  result?: any;
}

export interface AIMessageItemData {
  _id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  sources?: AISourceItem[];
  tool_calls?: AIToolCallItem[];
  feedback?: "thumbs_up" | "thumbs_down" | null;
  created_at: string;
}

export const AIWorkspaceAPI = {
  getConversations: async (): Promise<AIConversationItem[]> => {
    const res = await axiosInstance.get("/api/ai/conversations");
    return res.data.data;
  },

  createConversation: async (data: { title?: string; mode?: string; model?: string }): Promise<AIConversationItem> => {
    const res = await axiosInstance.post("/api/ai/conversations", data);
    return res.data.data;
  },

  getMessages: async (conversationId: string): Promise<AIMessageItemData[]> => {
    const res = await axiosInstance.get(`/api/ai/conversations/${conversationId}/messages`);
    return res.data.data;
  },

  updateConversation: async (id: string, updates: Partial<AIConversationItem>): Promise<AIConversationItem> => {
    const res = await axiosInstance.patch(`/api/ai/conversations/${id}`, updates);
    return res.data.data;
  },

  deleteConversation: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/api/ai/conversations/${id}`);
  },

  setFeedback: async (messageId: string, feedback: "thumbs_up" | "thumbs_down"): Promise<void> => {
    await axiosInstance.post(`/api/ai/messages/${messageId}/feedback`, { feedback });
  },

  confirmAction: async (actionId: string): Promise<any> => {
    const res = await axiosInstance.post(`/api/ai/actions/${actionId}/confirm`);
    return res.data.data;
  },

  cancelAction: async (actionId: string): Promise<any> => {
    const res = await axiosInstance.post(`/api/ai/actions/${actionId}/cancel`);
    return res.data.data;
  },

  sendMessage: async (data: { chatId: string; message: string; provider?: string; model?: string }): Promise<AIMessageItemData> => {
    const res = await axiosInstance.post("/chats/ai", data);
    return res.data.data;
  },
};
