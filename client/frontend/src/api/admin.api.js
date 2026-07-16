import AxiosInstance from "./axiosInstance.js";

const url = "admin/v1";

export const AdminAPI = {
  // Dashboard
  getDashboardStats: () => AxiosInstance.get(`/${url}/dashboard/stats`),

  // Organizations
  getOrganizations: (params) => AxiosInstance.get(`/${url}/organizations`, { params }),
  createOrganization: (data) => AxiosInstance.post(`/${url}/organizations`, data),
  updateOrganization: (id, data) => AxiosInstance.put(`/${url}/organizations/${id}`, data),
  deleteOrganization: (id) => AxiosInstance.delete(`/${url}/organizations/${id}`),
  getOrgUsers: (id, params) => AxiosInstance.get(`/${url}/organizations/${id}/users`, { params }),

  // Users
  getUsers: (params) => AxiosInstance.get(`/${url}/users`, { params }),
  createUser: (data) => AxiosInstance.post(`/${url}/users`, data),
  updateUser: (id, data) => AxiosInstance.put(`/${url}/users/${id}`, data),
  updateUserStatus: (id, status) => AxiosInstance.patch(`/${url}/users/${id}/status`, { status }),
  deleteUser: (id) => AxiosInstance.delete(`/${url}/users/${id}`),

  // Roles
  getRoles: (params) => AxiosInstance.get(`/${url}/roles`, { params }),
  createRole: (data) => AxiosInstance.post(`/${url}/roles`, data),
  updateRole: (id, data) => AxiosInstance.put(`/${url}/roles/${id}`, data),
  deleteRole: (id) => AxiosInstance.delete(`/${url}/roles/${id}`),

  // Audit Logs
  getAuditLogs: (params) => AxiosInstance.get(`/${url}/audit-logs`, { params }),
};
