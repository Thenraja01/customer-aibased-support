import AxiosInstance from "./axiosInstance.js";

export const KnowledgeGapAPI = {
  getAll: (params) => AxiosInstance.get("/knowledge-gaps", { params }),
  getStats: (params) => AxiosInstance.get("/knowledge-gaps/stats", { params }),
  getSuggestedTopics: (params) => AxiosInstance.get("/knowledge-gaps/suggested-topics", { params }),
  updateStatus: (id, data) => AxiosInstance.patch(`/knowledge-gaps/${id}/status`, data),
  resolve: (id, data) => AxiosInstance.patch(`/knowledge-gaps/${id}/resolve`, data),
  dismiss: (id) => AxiosInstance.patch(`/knowledge-gaps/${id}/dismiss`),
  delete: (id) => AxiosInstance.delete(`/knowledge-gaps/${id}`),
};
