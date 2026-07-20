import AxiosInstance from "./axiosInstance.js";

const url = "document-verifications";

const DocumentVerificationAPI = {
  getAll: (params) => AxiosInstance.get(`/${url}`, { params }),
  getByDocument: (documentId) =>
    AxiosInstance.get(`/${url}/document/${documentId}`),
  getByStatus: (status) => AxiosInstance.get(`/${url}/status/${status}`),
  create: (data) => AxiosInstance.post(`/${url}`, data),
  verify: (documentId, data) => AxiosInstance.post(`/${url}`, { document_id: documentId, ...data }),
  approve: (id) => AxiosInstance.patch(`/${url}/${id}/approve`),
  reject: (id, remarks) =>
    AxiosInstance.patch(`/${url}/${id}/reject`, { remarks }),
  delete: (id) => AxiosInstance.delete(`/${url}/${id}`),
  remove: (id) => AxiosInstance.delete(`/${url}/${id}`),
};

export default DocumentVerificationAPI;
