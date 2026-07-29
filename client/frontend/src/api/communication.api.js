import AxiosInstance from "./axiosInstance.ts";

export const CommunicationAPI = {
  send: (data) => AxiosInstance.post("/communications/send", data),
  sendToOrg: (data) => AxiosInstance.post("/communications/send/org", data),
  getConversation: (userId) => AxiosInstance.get(`/communications/conversation/${userId}`),
  getOrgConversations: () => AxiosInstance.get("/communications/org-conversations"),
  getOrgMessages: (orgId) => AxiosInstance.get(`/communications/org/${orgId}`),
  getMyOrgMessages: () => AxiosInstance.get("/communications/my-org"),
  getUnreadCount: () => AxiosInstance.get("/communications/unread/count"),
  getUnread: () => AxiosInstance.get("/communications/unread"),
  getPartners: () => AxiosInstance.get("/communications/partners"),
  markRead: (id) => AxiosInstance.patch(`/communications/${id}/read`),
  markOrgSeen: (orgId) => AxiosInstance.patch(`/communications/org/${orgId}/seen`),
  markAllRead: (senderId) => AxiosInstance.patch("/communications/read-all", { senderId }),
};
