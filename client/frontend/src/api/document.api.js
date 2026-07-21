import AxiosInstance from "./axiosInstance.js";

const url = "documents";

const DocumentAPI = {
  getAll: (params) => AxiosInstance.get(`/${url}`, { params }),

  getById: (id) => AxiosInstance.get(`/${url}/${id}`),

  getByUser: (userId) => AxiosInstance.get(`/${url}/user/${userId}`),

  getByStatus: (status, params) => AxiosInstance.get(`/${url}/status/${status}`, { params }),

  upload: (formData) =>
    AxiosInstance.post(`/${url}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  approve: (id) =>
    AxiosInstance.patch(`/${url}/${id}/approve`),

  reject: (id, remarks) =>
    AxiosInstance.patch(`/${url}/${id}/reject`, { remarks }),

  updateStatus: (id, status) =>
    AxiosInstance.patch(`/${url}/${id}/status`, { status }),

  remove: (id) => AxiosInstance.delete(`/${url}/${id}`),
};

export default DocumentAPI;
