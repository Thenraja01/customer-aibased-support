import AxiosInstance from "./axiosInstance.js";

const url = "documents";

const DocumentAPI = {
  getAll: () => AxiosInstance.get(`/${url}`),

  getById: (id) => AxiosInstance.get(`/${url}/${id}`),

  getByUser: (userId) => AxiosInstance.get(`/${url}/user/${userId}`),

  getByStatus: (status) => AxiosInstance.get(`/${url}/status/${status}`),

  upload: (formData) =>
    AxiosInstance.post(`/${url}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateStatus: (id, status) =>
    AxiosInstance.patch(`/${url}/${id}/status`, { status }),

  remove: (id) => AxiosInstance.delete(`/${url}/${id}`),
};

export default DocumentAPI;
