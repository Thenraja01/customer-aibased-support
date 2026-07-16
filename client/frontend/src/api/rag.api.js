import AxiosInstance from "./axiosInstance.js";

export const RAGAPI = {
  ingest: (data) => AxiosInstance.post("/rag/ingest", data),
  query: (data) => AxiosInstance.post("/rag/query", data),
  getStats: () => AxiosInstance.get("/rag/stats"),
  getGlobalStats: () => AxiosInstance.get("/rag/graph/stats"),
  getDocumentGraph: (documentId) => AxiosInstance.get(`/rag/graph/${documentId}`),
  getDocumentChunks: (documentId) => AxiosInstance.get(`/rag/chunks/${documentId}`),
  searchByKeyword: (params) => AxiosInstance.get("/rag/search", { params }),
  removeDocumentData: (documentId) => AxiosInstance.delete(`/rag/${documentId}`),
};
