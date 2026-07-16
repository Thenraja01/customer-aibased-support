import AxiosInstance from "./axiosInstance.js";

export const NotificationAPI = {
  create: (data) => AxiosInstance.post("/notifications", data),
  broadcast: (data) => AxiosInstance.post("/notifications/broadcast", data),
  getByUser: (userId) => AxiosInstance.get(`/notifications/user/${userId}`),
  getUnread: (userId) =>
    AxiosInstance.get(`/notifications/user/${userId}/unread`),
  getUnreadCount: (userId) =>
    AxiosInstance.get(`/notifications/user/${userId}/count`),
  markRead: (id) => AxiosInstance.patch(`/notifications/${id}/read`),
  markAllRead: (userId) =>
    AxiosInstance.patch(`/notifications/user/${userId}/read-all`),
  delete: (id) => AxiosInstance.delete(`/notifications/${id}`),
  clearAll: (userId) => AxiosInstance.delete(`/notifications/user/${userId}/clear`),
};
