import AxiosInstance from "./axiosInstance.ts";

export const NotificationAPI = {
  create: (data) => AxiosInstance.post("/notifications", data),
  broadcast: (data) => AxiosInstance.post("/notifications/broadcast", data),
  broadcastToOrg: (data) => AxiosInstance.post("/notifications/broadcast/org", data),
  broadcastToOrgById: (orgId, data) => AxiosInstance.post(`/notifications/broadcast/org/${orgId}`, data),
  broadcastToAll: (data) => AxiosInstance.post("/notifications/broadcast/all", data),
  getPreviewCount: (data) => AxiosInstance.post("/notifications/preview", data),
  getCampaigns: (params) => AxiosInstance.get("/notifications/campaigns", { params }),
  getCampaignById: (id) => AxiosInstance.get(`/notifications/campaigns/${id}`),
  getTemplates: () => AxiosInstance.get("/notifications/templates"),
  createTemplate: (data) => AxiosInstance.post("/notifications/templates", data),
  deleteTemplate: (id) => AxiosInstance.delete(`/notifications/templates/${id}`),
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
