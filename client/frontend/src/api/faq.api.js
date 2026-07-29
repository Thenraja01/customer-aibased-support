import AxiosInstance from "./axiosInstance.ts";

export const FAQAPI = {
  create: (data) => AxiosInstance.post("/faqs", data),
  getActive: () => AxiosInstance.get("/faqs/active"),
  getAll: (params) => AxiosInstance.get("/faqs", { params }),
  getById: (id) => AxiosInstance.get(`/faqs/${id}`),
  update: (id, data) => AxiosInstance.put(`/faqs/${id}`, data),
  delete: (id) => AxiosInstance.delete(`/faqs/${id}`),
  approve: (id) => AxiosInstance.patch(`/faqs/${id}/approve`),
  reject: (id, reason) => AxiosInstance.patch(`/faqs/${id}/reject`, { reason }),
  getByStatus: (status) => AxiosInstance.get(`/faqs/status/${status}`),
  getMy: () => AxiosInstance.get("/faqs/my"),
};
