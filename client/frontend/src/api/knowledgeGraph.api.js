import AxiosInstance from "./axiosInstance.ts";

export const KnowledgeGraphAPI = {
  getNodesByDocument: (documentId) => AxiosInstance.get(`/knowledge-graph/document/${documentId}`),
  searchNodes: (params) => AxiosInstance.get("/knowledge-graph/search", { params }),
  traverse: (params) => AxiosInstance.get("/knowledge-graph/traverse", { params }),
  getStats: (documentId) => AxiosInstance.get(`/knowledge-graph/stats/${documentId}`),
  getNodeById: (id) => AxiosInstance.get(`/knowledge-graph/${id}`),

  // New Graph Explorer APIs
  getGraphStats: () => AxiosInstance.get("/knowledge-graph/stats"),
  getIndexStatus: () => AxiosInstance.get("/knowledge-graph/index-status"),
  getEntities: (params) => AxiosInstance.get("/knowledge-graph/entities", { params }),
  getEntityById: (id) => AxiosInstance.get(`/knowledge-graph/entities/${id}`),
  getEntityRelationships: (id) => AxiosInstance.get(`/knowledge-graph/entities/${id}/relationships`),
  getRelationships: (params) => AxiosInstance.get("/knowledge-graph/relationships", { params }),
  getTopics: () => AxiosInstance.get("/knowledge-graph/topics"),
  searchGraph: (params) => AxiosInstance.get("/knowledge-graph/search", { params }),
  getSubgraph: (params) => AxiosInstance.get("/knowledge-graph/subgraph", { params }),
  reindexKnowledge: () => AxiosInstance.post("/knowledge-graph/reindex"),
  rebuildGraph: () => AxiosInstance.post("/knowledge-graph/rebuild"),
};
