import AxiosInstance from "./axiosInstance.ts";

export const KnowledgeGraphAPI = {
  getNodesByDocument: (documentId) => AxiosInstance.get(`/knowledge-graph/document/${documentId}`),
  searchNodes: (params) => AxiosInstance.get("/knowledge-graph/search", { params }),
  traverse: (params) => AxiosInstance.get("/knowledge-graph/traverse", { params }),
  getStats: (documentId) => AxiosInstance.get(`/knowledge-graph/stats/${documentId}`),
  getNodeById: (id) => AxiosInstance.get(`/knowledge-graph/${id}`),
};
