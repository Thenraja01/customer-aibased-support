import AxiosInstance from "@/api/axiosInstance";

export const apiClient = AxiosInstance;

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export function normalizeError(error: any): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return typeof error.response.data.error === "string"
      ? error.response.data.error
      : error.response.data.error.message || "An error occurred";
  }
  if (error.message) {
    return error.message;
  }
  return "An unexpected network error occurred";
}

export default apiClient;
