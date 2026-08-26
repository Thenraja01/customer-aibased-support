import AxiosInstance from "./axiosInstance.ts";

export const CommunicationAPI = {
  send: (data) => AxiosInstance.post("/communications/send", data),
  sendToOrg: (data) => AxiosInstance.post("/communications/send/org", data),
  sendToBranch: (data) => AxiosInstance.post("/communications/send/branch", data),
  getConversation: (userId) => AxiosInstance.get(`/communications/conversation/${userId}`),
  getOrgConversations: () => AxiosInstance.get("/communications/org-conversations"),
  getOrgMessages: (orgId) => AxiosInstance.get(`/communications/org/${orgId}`),
  getBranchMessages: (branchId) => AxiosInstance.get(`/communications/branch/${branchId}`),
  getMyOrgMessages: () => AxiosInstance.get("/communications/my-org"),
  getMyBranchMessages: () => AxiosInstance.get("/communications/my-branch"),
  getUnreadCount: () => AxiosInstance.get("/communications/unread/count"),
  getUnread: () => AxiosInstance.get("/communications/unread"),
  getPartners: () => AxiosInstance.get("/communications/partners"),
  markRead: (id) => AxiosInstance.patch(`/communications/${id}/read`),
  markOrgSeen: (orgId) => AxiosInstance.patch(`/communications/org/${orgId}/seen`),
  markBranchSeen: (branchId) => AxiosInstance.patch(`/communications/branch/${branchId}/seen`),
  markAllRead: (senderId) => AxiosInstance.patch("/communications/read-all", { senderId }),
};
