import AxiosInstance from "./axiosInstance.ts";

export const NotificationAPI = {
  create: (data) => AxiosInstance.post("/notifications", data),
  broadcast: (data) => AxiosInstance.post("/notifications/broadcast", data),
  broadcastToOrg: (data) => AxiosInstance.post("/notifications/broadcast/org", data),
  broadcastToOrgById: (orgId, data) => AxiosInstance.post(`/notifications/broadcast/org/${orgId}`, data),
  broadcastToAll: (data) => AxiosInstance.post("/notifications/broadcast/all", data),
  getByUser: (userId) => AxiosInstance.get(`/notifications/user/${userId}`),
  getUnread: (userId) =>
    AxiosInstance.get(`/notifications/user/${userId}/unread`),
  getUnreadCount: (userId) =>
    AxiosInstance.get(`/notifications/user/${userId}/unread/count`),
  markRead: (id) => AxiosInstance.patch(`/notifications/${id}/read`),
  markAllRead: (userId) =>
    AxiosInstance.patch(`/notifications/user/${userId}/read-all`),
  delete: (id) => AxiosInstance.delete(`/notifications/${id}`),
  clearAll: (userId) => AxiosInstance.delete(`/notifications/user/${userId}/clear`),
};
