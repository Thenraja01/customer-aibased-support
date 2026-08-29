import { apiClient } from "@/services/api";

const BASE_URL = "/auth/v1";

export const authApi = {
  signup: (data: any) => apiClient.post(`${BASE_URL}/register`, data),
  login: (data: any) => apiClient.post(`${BASE_URL}/login`, data),
  refresh: (refreshToken: string) => apiClient.post(`${BASE_URL}/refresh`, { refreshToken }),
  logout: (refreshToken?: string) => apiClient.post(`${BASE_URL}/logout`, { refreshToken }),
  getMe: () => apiClient.get(`${BASE_URL}/me`),
  updateProfile: (data: any) => apiClient.put(`${BASE_URL}/profile`, data),
};

export default authApi;
