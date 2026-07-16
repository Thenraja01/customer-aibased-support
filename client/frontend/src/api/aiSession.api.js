import AxiosInstance from "./axiosInstance.js";

export const AISessionAPI = {
  create: (data) => AxiosInstance.post("/ai-sessions", data),
  getAll: (params) => AxiosInstance.get("/ai-sessions", { params }),
  getStats: () => AxiosInstance.get("/ai-sessions/stats"),
  getByChat: (chatId) => AxiosInstance.get(`/ai-sessions/chat/${chatId}`),
  getChatTokens: (chatId) => AxiosInstance.get(`/ai-sessions/chat/${chatId}/tokens`),
  getById: (id) => AxiosInstance.get(`/ai-sessions/${id}`),
  removeByChat: (chatId) => AxiosInstance.delete(`/ai-sessions/chat/${chatId}`),
};
