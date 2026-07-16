import AxiosInstance from "./axiosInstance.js";

export const UsersAPI = {
  getAll: (params) => AxiosInstance.get("/users", { params }),
  getById: (id) => AxiosInstance.get(`/users/${id}`),
  create: (data) => AxiosInstance.post("/users", data),
  update: (id, data) => AxiosInstance.put(`/users/${id}`, data),
  delete: (id) => AxiosInstance.delete(`/users/${id}`),
  updateStatus: (id, status) => AxiosInstance.patch(`/users/${id}/status`, { status }),
  getProfile: () => AxiosInstance.get("/users/profile"),
  updateProfile: (data) => AxiosInstance.put("/users/profile", data),

  changePassword: (currentPassword, newPassword) =>
    AxiosInstance.put("/users/password", { currentPassword, newPassword }),
};
