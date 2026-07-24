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

  // Organization Settings
  getOrgSettings: () => AxiosInstance.get(`/${url}/organization/settings`),
  updateOrgSettings: (data) => AxiosInstance.put(`/${url}/organization/settings`, data),

  // Chat History
  getChats: (params) => AxiosInstance.get(`/${url}/chats`, { params }),
  getChatDetail: (id) => AxiosInstance.get(`/${url}/chats/${id}`),
  deleteChat: (id) => AxiosInstance.delete(`/${url}/chats/${id}`),

  // Users (basic list for filters)
  getUsersBasic: (params) => AxiosInstance.get(`/${url}/users/basic`, { params }),

  // Command Center
  getCommandCenterStatus: () => AxiosInstance.get(`/${url}/command-center/status`),
  toggleMaintenanceMode: (enabled) => AxiosInstance.post(`/${url}/command-center/toggle-maintenance`, { enabled }),
  sendGlobalNotification: (data) => AxiosInstance.post(`/${url}/command-center/global-notification`, data),
  impersonateOrg: (organizationId) => AxiosInstance.post(`/${url}/command-center/impersonate`, { organizationId }),
  clearSystemCache: () => AxiosInstance.post(`/${url}/command-center/clear-cache`),
  restartBackgroundJobs: () => AxiosInstance.post(`/${url}/command-center/restart-jobs`),
  backupDatabase: () => AxiosInstance.post(`/${url}/command-center/backup-db`),

  // Global Application Settings
  getGlobalSettings: () => AxiosInstance.get(`/${url}/global-settings`),
  updateGlobalSettings: (data) => AxiosInstance.put(`/${url}/global-settings`, data),

  // Organization Full Details & Analytics
  getOrgFullDetails: (id) => AxiosInstance.get(`/${url}/organizations/${id}/full-details`),
  getOrgAnalytics: (id) => AxiosInstance.get(`/${url}/organizations/${id}/analytics`),
};
