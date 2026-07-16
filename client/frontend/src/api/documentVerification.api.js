import AxiosInstance from "./axiosInstance.js";

const url = "document-verifications";

const DocumentVerificationAPI = {
  getAll: () => AxiosInstance.get(`/${url}`),

  getByDocument: (documentId) =>
    AxiosInstance.get(`/${url}/document/${documentId}`),

  getByStatus: (status) => AxiosInstance.get(`/${url}/status/${status}`),

  create: (data) => AxiosInstance.post(`/${url}`, data),

  approve: (id) => AxiosInstance.patch(`/${url}/${id}/approve`),

  reject: (id, remarks) =>
    AxiosInstance.patch(`/${url}/${id}/reject`, { remarks }),

  remove: (id) => AxiosInstance.delete(`/${url}/${id}`),
};

export default DocumentVerificationAPI;
