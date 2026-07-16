import AxiosInstance from "./axiosInstance.js";

export const FAQAPI = {
  create: (data) => AxiosInstance.post("/faqs", data),
  getActive: () => AxiosInstance.get("/faqs/active"),
  getAll: (params) => AxiosInstance.get("/faqs", { params }),
  getById: (id) => AxiosInstance.get(`/faqs/${id}`),
  update: (id, data) => AxiosInstance.put(`/faqs/${id}`, data),
  delete: (id) => AxiosInstance.delete(`/faqs/${id}`),
};
