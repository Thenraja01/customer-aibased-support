import { apiClient } from "@/services/api";

export const organizationApi = {
  getSettings: () => apiClient.get("/admin/v1/settings"),
  updateSettings: (data: any) => apiClient.put("/admin/v1/settings", data),
  getUsers: (params?: any) => apiClient.get("/admin/v1/users", { params }),
  getBranches: () => apiClient.get("/admin/v1/branches"),
};

export default organizationApi;
