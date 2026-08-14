import AxiosInstance from "./axiosInstance.ts";

const url = "documents";

const DocumentAPI = {
  getAll: (params) => AxiosInstance.get(`/${url}`, { params }),

  getById: (id) => AxiosInstance.get(`/${url}/${id}`),

  view: (id) => AxiosInstance.get(`/${url}/${id}/view`, { params: { json: true } }),

  // Resolve a freshly-signed Cloudinary URL through the authenticated axios
  // instance. The signed `file_url` on document objects embeds an access token
  // that can expire; this path refreshes auth and always returns a valid URL.
  resolveDocumentUrl: async (id) => {
    const res = await DocumentAPI.view(id);
    const signedUrl = res?.data?.url;
    if (!signedUrl) throw new Error("Could not resolve document URL");
    return signedUrl;
  },

  getByUser: (userId) => AxiosInstance.get(`/${url}/user/${userId}`),

  getByStatus: (status, params) => AxiosInstance.get(`/${url}/status/${status}`, { params }),

  upload: (formData) =>
    AxiosInstance.post(`/${url}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  uploadNewVersion: (id, formData) =>
    AxiosInstance.post(`/${url}/${id}/versions`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  retryIngestion: (id) => AxiosInstance.post(`/${url}/${id}/retry-ingestion`),

  approve: (id) =>
    AxiosInstance.patch(`/${url}/${id}/approve`),

  reject: (id, remarks) =>
    AxiosInstance.patch(`/${url}/${id}/reject`, { remarks }),

  publish: (id) =>
    AxiosInstance.patch(`/${url}/${id}/publish`),

  updateStatus: (id, status) =>
    AxiosInstance.patch(`/${url}/${id}/status`, { status }),

  patchStatus: (id, data) =>
    AxiosInstance.patch(`/${url}/${id}/status`, data),

  remove: (id) => AxiosInstance.delete(`/${url}/${id}`),

  getRoles: (id) => AxiosInstance.get(`/${url}/${id}/roles`),

  setRoles: (id, roleIds) => AxiosInstance.put(`/${url}/${id}/roles`, { role_ids: roleIds }),
};

export default DocumentAPI;
