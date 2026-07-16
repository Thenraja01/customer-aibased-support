import AxiosInstance from "./axiosInstance.js";

export const MessageAPI = {
  send: (data) => AxiosInstance.post("/messages", data),
  getByChat: (chatId) => AxiosInstance.get(`/messages/chat/${chatId}`),
  getPaginated: (chatId, params) =>
    AxiosInstance.get(`/messages/chat/${chatId}/paginated`, { params }),
  getLatest: (chatId) => AxiosInstance.get(`/messages/chat/${chatId}/latest`),
  getCount: (chatId) => AxiosInstance.get(`/messages/chat/${chatId}/count`),
  getAI: (chatId) => AxiosInstance.get(`/messages/chat/${chatId}/ai`),
  search: (chatId, params) =>
    AxiosInstance.get(`/messages/chat/${chatId}/search`, { params }),
  update: (id, data) => AxiosInstance.put(`/messages/${id}`, data),
  delete: (id) => AxiosInstance.delete(`/messages/${id}`),
  deleteAll: (chatId) => AxiosInstance.delete(`/messages/chat/${chatId}/all`),
};
