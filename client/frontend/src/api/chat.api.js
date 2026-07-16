import AxiosInstance from "./axiosInstance.js";

export const ChatAPI = {
  create: (data) => AxiosInstance.post("/chats", data),
  getAll: (params) => AxiosInstance.get("/chats", { params }),
  getActive: () => AxiosInstance.get("/chats/active"),
  getById: (id) => AxiosInstance.get(`/chats/${id}`),
  getByUser: (userId) => AxiosInstance.get(`/chats/user/${userId}`),
  getUserCount: (userId) => AxiosInstance.get(`/chats/user/${userId}/count`),
  search: (params) => AxiosInstance.get("/chats/search", { params }),
  updateTopic: (id, data) => AxiosInstance.patch(`/chats/${id}/topic`, data),
  close: (id) => AxiosInstance.patch(`/chats/${id}/close`),
  reopen: (id) => AxiosInstance.patch(`/chats/${id}/reopen`),
  delete: (id) => AxiosInstance.delete(`/chats/${id}`),
  sendAI: (chatId, message) =>
    AxiosInstance.post("/chats/ai", { chatId, message }),
};
