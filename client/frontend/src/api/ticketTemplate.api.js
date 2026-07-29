import AxiosInstance from "./axiosInstance.ts";

export const TicketTemplateAPI = {
  create: (data) => AxiosInstance.post("/ticket-templates", data),
  getAll: () => AxiosInstance.get("/ticket-templates"),
  getActive: () => AxiosInstance.get("/ticket-templates/active"),
  getById: (id) => AxiosInstance.get(`/ticket-templates/${id}`),
  update: (id, data) => AxiosInstance.put(`/ticket-templates/${id}`, data),
  delete: (id) => AxiosInstance.delete(`/ticket-templates/${id}`),
};
