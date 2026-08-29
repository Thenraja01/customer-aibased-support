import { apiClient } from "@/services/api";

export const chatApi = {
  create: (data: any) => apiClient.post("/chats", data),
  getAll: (params?: any) => apiClient.get("/chats", { params }),
  getActive: () => apiClient.get("/chats/active"),
  getById: (id: string) => apiClient.get(`/chats/${id}`),
  getByUser: (userId: string) => apiClient.get(`/chats/user/${userId}`),
  getUserCount: (userId: string) => apiClient.get(`/chats/user/${userId}/count`),
  search: (params?: any) => apiClient.get("/chats/search", { params }),
  updateTopic: (id: string, data: any) => apiClient.patch(`/chats/${id}/topic`, data),
  close: (id: string) => apiClient.patch(`/chats/${id}/close`),
  closeAll: () => apiClient.patch("/chats/close-all"),
  reopen: (id: string) => apiClient.patch(`/chats/${id}/reopen`),
  delete: (id: string) => apiClient.delete(`/chats/${id}`),
  getQuickActions: () => apiClient.get("/chats/quick-actions"),
  sendAI: (chatId: string, message: string, model?: string, actionConfirm?: any) =>
    apiClient.post("/chats/ai", { chatId, message, model, actionConfirm }, { timeout: 180000 }),
};

export default chatApi;
