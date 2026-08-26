import AxiosInstance from "./axiosInstance.ts";

const url = "documents";

export const DocumentAPI = {
  getAll: (params) => AxiosInstance.get(`/${url}`, { params }),

  getById: (id) => AxiosInstance.get(`/${url}/${id}`),

  getByStatus: (status) => AxiosInstance.get(`/${url}/status/${status}`),

  getByUser: (userId) => AxiosInstance.get(`/${url}/user/${userId}`),

  upload: (formData) =>
    AxiosInstance.post(`/${url}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  uploadNewVersion: (id, formData) =>
    AxiosInstance.post(`/${url}/${id}/version`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateStatus: (id, status) => AxiosInstance.patch(`/${url}/${id}/status`, { status }),

  patchStatus: (id, data) => AxiosInstance.patch(`/${url}/${id}/status`, data),

  approve: (id) => AxiosInstance.patch(`/${url}/${id}/approve`),

  reject: (id, remarks) => AxiosInstance.patch(`/${url}/${id}/reject`, { remarks }),

  publish: (id) => AxiosInstance.patch(`/${url}/${id}/publish`),

  remove: (id) => AxiosInstance.delete(`/${url}/${id}`),

  delete: (id) => AxiosInstance.delete(`/${url}/${id}`),

  retryIngestion: (id) => AxiosInstance.post(`/${url}/${id}/retry-ingestion`),

  reprocess: (id) => AxiosInstance.post(`/${url}/${id}/reprocess`),

  resolveDocumentUrl: async (docId) => {
    try {
      const res = await AxiosInstance.get(`/${url}/${docId}`);
      return res.data?.data?.file_url || res.data?.file_url || `/documents/${docId}/view`;
    } catch {
      return `/documents/${docId}/view`;
    }
  },
};

export default DocumentAPI;
