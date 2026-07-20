import AxiosInstance from "./axiosInstance.js";

const url = "auth/v1";

export const AuthAPI = {
  signup: (data) => AxiosInstance.post(`/${url}/register`, data),
  login: (data) => AxiosInstance.post(`/${url}/login`, data),
  logout: () => AxiosInstance.post(`/${url}/logout`),
  refreshToken: (refreshToken) => AxiosInstance.post(`/${url}/refresh`, { refreshToken }),
  sendOTP: (phone) => AxiosInstance.post(`/${url}/otp/send`, { phone }),
  verifyOTP: (phone, otp) => AxiosInstance.post(`/${url}/otp/verify`, { phone, otp }),
  forgotPassword: (email) => AxiosInstance.post(`/${url}/forgot-password`, { email }),
  resetPassword: (token, newPassword) => AxiosInstance.post(`/${url}/reset-password`, { token, newPassword }),
  getOrganizations: () => AxiosInstance.get(`/${url}/organizations`),
  getRoles: () => AxiosInstance.get(`/${url}/roles`),
  getUIConfig: () => AxiosInstance.get(`/${url}/ui-config`),
};
