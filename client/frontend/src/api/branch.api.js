import AxiosInstance from "./axiosInstance.ts";

const url = "branches";

const BranchAPI = {
  getAll: (params) => AxiosInstance.get(`/${url}`, { params }),

  getById: (id) => AxiosInstance.get(`/${url}/${id}`),

  search: (q) => AxiosInstance.get(`/${url}/search`, { params: { q } }),

  create: (data) => AxiosInstance.post(`/${url}`, data),

  update: (id, data) => AxiosInstance.put(`/${url}/${id}`, data),

  remove: (id) => AxiosInstance.delete(`/${url}/${id}`),
};

export default BranchAPI;
