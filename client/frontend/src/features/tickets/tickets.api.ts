import { apiClient } from "@/services/api";

export const ticketApi = {
  create: (data: any) => apiClient.post("/tickets", data),
  getAll: (params?: any) => apiClient.get("/tickets", { params }),
  getStats: () => apiClient.get("/tickets/stats"),
  getById: (id: string) => apiClient.get(`/tickets/${id}`),
  getByUser: (userId: string) => apiClient.get(`/tickets/user/${userId}`),
  getBySupport: (supportId: string) => apiClient.get(`/tickets/support/${supportId}`),
  getByStatus: (status: string) => apiClient.get(`/tickets/status/${status}`),
  assign: (id: string, data: any) => apiClient.patch(`/tickets/${id}/assign`, data),
  updatePriority: (id: string, data: any) => apiClient.patch(`/tickets/${id}/priority`, data),
  resolve: (id: string, data?: any) => apiClient.patch(`/tickets/${id}/resolve`, data),
  close: (id: string) => apiClient.patch(`/tickets/${id}/close`),
  delete: (id: string) => apiClient.delete(`/tickets/${id}`),
  setPending: (id: string) => apiClient.patch(`/tickets/${id}/pending`),
  setInProgress: (id: string) => apiClient.patch(`/tickets/${id}/in-progress`),
  reopen: (id: string) => apiClient.patch(`/tickets/${id}/reopen`),
  getMessages: (id: string) => apiClient.get(`/tickets/${id}/messages`),
  sendMessage: (id: string, data: any) => apiClient.post(`/tickets/${id}/messages`, data),
  deleteMessage: (ticketId: string, messageId: string) => apiClient.delete(`/tickets/${ticketId}/messages/${messageId}`),
  escalateFromChat: (data: any) => apiClient.post("/tickets/escalate-from-chat", data),
  getQueue: () => apiClient.get("/tickets/queue"),
  smartAssign: (ticketId: string) => apiClient.post(`/tickets/${ticketId}/smart-assign`),
};

export default ticketApi;
