import AxiosInstance from "./axiosInstance.js";

export const TicketAPI = {
  create: (data) => AxiosInstance.post("/tickets", data),
  getAll: (params) => AxiosInstance.get("/tickets", { params }),
  getStats: () => AxiosInstance.get("/tickets/stats"),
  getById: (id) => AxiosInstance.get(`/tickets/${id}`),
  getByUser: (userId) => AxiosInstance.get(`/tickets/user/${userId}`),
  getByAgent: (agentId) => AxiosInstance.get(`/tickets/agent/${agentId}`),
  getByStatus: (status) => AxiosInstance.get(`/tickets/status/${status}`),
  assign: (id, data) => AxiosInstance.patch(`/tickets/${id}/assign`, data),
  updatePriority: (id, data) =>
    AxiosInstance.patch(`/tickets/${id}/priority`, data),
  resolve: (id, data) => AxiosInstance.patch(`/tickets/${id}/resolve`, data),
  close: (id) => AxiosInstance.patch(`/tickets/${id}/close`),
  delete: (id) => AxiosInstance.delete(`/tickets/${id}`),
};
