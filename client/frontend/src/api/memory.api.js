import AxiosInstance from "./axiosInstance.ts";

export const MemoryAPI = {
  store: (data) => AxiosInstance.post("/memory/store", data),
  getUserMemories: (userId) => AxiosInstance.get(`/memory/user/${userId}`),
  searchByKeyword: (userId, params) => AxiosInstance.get(`/memory/user/${userId}/search`, { params }),
  getRelevant: (userId, params) => AxiosInstance.get(`/memory/user/${userId}/relevant`, { params }),
  getStats: (userId) => AxiosInstance.get(`/memory/user/${userId}/stats`),
  getContext: (userId, params) => AxiosInstance.get(`/memory/user/${userId}/context`, { params }),
  extractFacts: (userId, data) => AxiosInstance.post(`/memory/user/${userId}/extract`, data),
  update: (memoryId, data) => AxiosInstance.patch(`/memory/${memoryId}`, data),
  remove: (memoryId) => AxiosInstance.delete(`/memory/${memoryId}`),
  removeUserMemories: (userId) => AxiosInstance.delete(`/memory/user/${userId}`),
  loadShortTerm: (chatId) => AxiosInstance.get(`/memory/chat/${chatId}/short-term`),
  clearShortTerm: (chatId) => AxiosInstance.delete(`/memory/chat/${chatId}/short-term`),
};
