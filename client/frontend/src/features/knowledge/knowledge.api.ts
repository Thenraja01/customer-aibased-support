import { apiClient } from "@/services/api";

export const knowledgeApi = {
  getDocuments: (params?: any) => apiClient.get("/documents", { params }),
  getDocumentById: (id: string) => apiClient.get(`/documents/${id}`),
  viewDocument: (id: string) => apiClient.get(`/documents/${id}/view`, { params: { json: true } }),
  uploadDocument: (formData: FormData) =>
    apiClient.post("/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  approveDocument: (id: string) => apiClient.patch(`/documents/${id}/approve`),
  rejectDocument: (id: string, remarks: string) => apiClient.patch(`/documents/${id}/reject`, { remarks }),
  publishDocument: (id: string) => apiClient.patch(`/documents/${id}/publish`),
  deleteDocument: (id: string) => apiClient.delete(`/documents/${id}`),
  getFaqs: (params?: any) => apiClient.get("/faq", { params }),
  createFaq: (data: any) => apiClient.post("/faq", data),
  updateFaq: (id: string, data: any) => apiClient.put(`/faq/${id}`, data),
  deleteFaq: (id: string) => apiClient.delete(`/faq/${id}`),
};

export default knowledgeApi;
