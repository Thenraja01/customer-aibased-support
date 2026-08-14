import AxiosInstance from "./axiosInstance.ts";

export const UsersAPI = {
  getAll: (params) => AxiosInstance.get("/users", { params }),
  getCustomers: () => AxiosInstance.get("/users/customers"),
  getById: (id) => AxiosInstance.get(`/users/${id}`),
  create: (data) => AxiosInstance.post("/users", data),
  update: (id, data) => AxiosInstance.put(`/users/${id}`, data),
  delete: (id) => AxiosInstance.delete(`/users/${id}`),
  updateStatus: (id, status) => AxiosInstance.patch(`/users/${id}/status`, { status }),
  getProfile: () => AxiosInstance.get("/users/profile"),
  updateProfile: (data) => AxiosInstance.put("/users/profile", data),
  updateAvatar: (formData) => AxiosInstance.put("/users/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  enable2FA: () => AxiosInstance.post("/users/profile/2fa/enable"),
  disable2FA: () => AxiosInstance.post("/users/profile/2fa/disable"),

  changePassword: (currentPassword, newPassword) =>
    AxiosInstance.put("/users/password", { currentPassword, newPassword }),

  requestOtp: (email) => AxiosInstance.post("/users/otp/request", { email }),
  verifyOtp: (email, otp) => AxiosInstance.post("/users/otp/verify", { email, otp }),
  resetPasswordWithOtp: (email, otp, newPassword) =>
    AxiosInstance.post("/users/otp/reset-password", { email, otp, newPassword }),
};
