import AxiosInstance from "./axiosInstance.js";

export const TicketAPI = {
  create: (data) => AxiosInstance.post("/tickets", data),
  getAll: (params) => AxiosInstance.get("/tickets", { params }),
  getStats: () => AxiosInstance.get("/tickets/stats"),
  getById: (id) => AxiosInstance.get(`/tickets/${id}`),
  getByUser: (userId) => AxiosInstance.get(`/tickets/user/${userId}`),
  getBySupport: (supportId) => AxiosInstance.get(`/tickets/support/${supportId}`),
  getByStatus: (status) => AxiosInstance.get(`/tickets/status/${status}`),
  assign: (id, data) => AxiosInstance.patch(`/tickets/${id}/assign`, data),
  updatePriority: (id, data) =>
    AxiosInstance.patch(`/tickets/${id}/priority`, data),
  resolve: (id, data) => AxiosInstance.patch(`/tickets/${id}/resolve`, data),
  close: (id) => AxiosInstance.patch(`/tickets/${id}/close`),
  delete: (id) => AxiosInstance.delete(`/tickets/${id}`),
  setPending: (id) => AxiosInstance.patch(`/tickets/${id}/pending`),
  setInProgress: (id) => AxiosInstance.patch(`/tickets/${id}/in-progress`),
  reopen: (id) => AxiosInstance.patch(`/tickets/${id}/reopen`),
  getMessages: (id) => AxiosInstance.get(`/tickets/${id}/messages`),
  sendMessage: (id, data) => AxiosInstance.post(`/tickets/${id}/messages`, data),
  deleteMessage: (ticketId, messageId) => AxiosInstance.delete(`/tickets/${ticketId}/messages/${messageId}`),
  escalateFromChat: (data) => AxiosInstance.post("/tickets/escalate-from-chat", data),
  getQueue: () => AxiosInstance.get("/tickets/queue"),
  smartAssign: (ticketId) => AxiosInstance.post(`/tickets/${ticketId}/smart-assign`),
};
