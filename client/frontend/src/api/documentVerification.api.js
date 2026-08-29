import AxiosInstance from "./axiosInstance.ts";

const url = "document-verifications";

const DocumentVerificationAPI = {
  getAll: (params) => AxiosInstance.get(`/${url}`, { params }),

  getByDocument: (documentId) =>
    AxiosInstance.get(`/${url}/document/${documentId}`),

  getByStatus: (status, params) => AxiosInstance.get(`/${url}/status/${status}`, { params }),

  create: (data) => AxiosInstance.post(`/${url}`, data),

  approve: (id) => AxiosInstance.patch(`/${url}/${id}/approve`),

  reject: (id, remarks) =>
    AxiosInstance.patch(`/${url}/${id}/reject`, { remarks }),

  remove: (id) => AxiosInstance.delete(`/${url}/${id}`),
};

export default DocumentVerificationAPI;
