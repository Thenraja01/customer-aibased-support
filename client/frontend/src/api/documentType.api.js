import AxiosInstance from "./axiosInstance.js";

const url = "document-types";

const DocumentTypeAPI = {
  getAll: () => AxiosInstance.get(`/${url}`),

  getById: (id) => AxiosInstance.get(`/${url}/${id}`),

  create: (data) => AxiosInstance.post(`/${url}`, data),

  update: (id, data) => AxiosInstance.put(`/${url}/${id}`, data),

  remove: (id) => AxiosInstance.delete(`/${url}/${id}`),
};

export default DocumentTypeAPI;
