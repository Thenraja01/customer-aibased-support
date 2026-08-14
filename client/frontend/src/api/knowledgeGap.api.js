import AxiosInstance from "./axiosInstance.ts";

export const KnowledgeGapAPI = {
  getAll: (params) => AxiosInstance.get("/knowledge-gaps", { params }),
  getStats: (params) => AxiosInstance.get("/knowledge-gaps/stats", { params }),
  getSuggestedTopics: (params) => AxiosInstance.get("/knowledge-gaps/suggested-topics", { params }),
  getById: (id) => AxiosInstance.get(`/knowledge-gaps/${id}`),
  getSuggestedKnowledge: (id) => AxiosInstance.get(`/knowledge-gaps/${id}/suggested-knowledge`),
  getSimilar: (id) => AxiosInstance.get(`/knowledge-gaps/${id}/similar`),
  updateStatus: (id, data) => AxiosInstance.patch(`/knowledge-gaps/${id}/status`, data),
  resolve: (id, data) => AxiosInstance.patch(`/knowledge-gaps/${id}/resolve`, data),
  resolveWithFaq: (id, data) => AxiosInstance.post(`/knowledge-gaps/${id}/resolve/faq`, data),
  resolveWithDocument: (id, data) => AxiosInstance.post(`/knowledge-gaps/${id}/resolve/document`, data),
  resolveWithLink: (id, data) => AxiosInstance.post(`/knowledge-gaps/${id}/resolve/link`, data),
  retest: (id) => AxiosInstance.post(`/knowledge-gaps/${id}/retest`),
  dismiss: (id) => AxiosInstance.patch(`/knowledge-gaps/${id}/dismiss`),
  delete: (id) => AxiosInstance.delete(`/knowledge-gaps/${id}`),
};
