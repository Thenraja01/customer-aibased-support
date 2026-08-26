import AxiosInstance from "./axiosInstance";

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface AuditLogFilters extends PaginationParams {
  userId?: string;
  action?: string;
  tableName?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface AuditLogEntry {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
  } | string;
  organization_id?: string;
  branch_id?: string;
  action: string;
  table_name: string;
  record_id: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class AdminAPIClass {
  // Audit Logs
  async getAuditLogs(params: AuditLogFilters = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const res = await AxiosInstance.get(`/admin/v1/audit-logs?${searchParams.toString()}`);
    return res.data;
  }

  async getAuditLogsPaginated(params: AuditLogFilters = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const res = await AxiosInstance.get(`/audit-logs/paginated?${searchParams.toString()}`);
    return res.data;
  }

  // Dashboard
  getDashboardStats(): Promise<any> {
    return AxiosInstance.get("/admin/v1/dashboard/stats");
  }

  // Organizations
  getOrganizations(params: PaginationParams & { search?: string } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    return AxiosInstance.get(`/admin/v1/organizations?${searchParams.toString()}`);
  }

  getOrgUsers(orgId: string, params: PaginationParams & { search?: string; branchId?: string } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    return AxiosInstance.get(`/admin/v1/organizations/${orgId}/users?${searchParams.toString()}`);
  }

  createOrganization(data: Record<string, unknown>): Promise<any> {
    return AxiosInstance.post("/admin/v1/organizations", data);
  }

  updateOrganization(id: string, data: Record<string, unknown>): Promise<any> {
    return AxiosInstance.put(`/admin/v1/organizations/${id}`, data);
  }

  deleteOrganization(id: string): Promise<any> {
    return AxiosInstance.delete(`/admin/v1/organizations/${id}`);
  }

  // Users
  getUsers(params: PaginationParams & { search?: string; status?: string; branchId?: string; role?: string } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    return AxiosInstance.get(`/admin/v1/users?${searchParams.toString()}`);
  }

  createUser(data: Record<string, unknown>): Promise<any> {
    return AxiosInstance.post("/admin/v1/users", data);
  }

  updateUser(id: string, data: Record<string, unknown>): Promise<any> {
    return AxiosInstance.put(`/admin/v1/users/${id}`, data);
  }

  updateUserStatus(id: string, status: string): Promise<any> {
    return AxiosInstance.patch(`/admin/v1/users/${id}/status`, { status });
  }

  deleteUser(id: string): Promise<any> {
    return AxiosInstance.delete(`/admin/v1/users/${id}`);
  }

  // Roles
  getRoles(params: PaginationParams = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    return AxiosInstance.get(`/admin/v1/roles?${searchParams.toString()}`);
  }

  // Documents
  getDocuments(params: PaginationParams & { status?: string; assigned_role?: string; search?: string } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    return AxiosInstance.get(`/admin/v1/documents?${searchParams.toString()}`);
  }

  // Chats
  getChats(params: PaginationParams & { search?: string; status?: string; from?: string; to?: string; userId?: string; stats?: boolean } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    return AxiosInstance.get(`/admin/v1/chats?${searchParams.toString()}`);
  }

  getChatDetail(id: string): Promise<any> {
    return AxiosInstance.get(`/admin/v1/chats/${id}`);
  }

  exportChats(params: { search?: string; status?: string; from?: string; to?: string; userId?: string } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    return AxiosInstance.get(`/admin/v1/chats/export?${searchParams.toString()}`, {
      responseType: "blob",
    });
  }

  // Document Types
  getDocumentTypes(params: PaginationParams & { search?: string } = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    return AxiosInstance.get(`/admin/v1/document-types?${searchParams.toString()}`);
  }

  createDocumentType(data: Record<string, unknown>): Promise<any> {
    return AxiosInstance.post("/admin/v1/document-types", data);
  }

  updateDocumentType(id: string, data: Record<string, unknown>): Promise<any> {
    return AxiosInstance.put(`/admin/v1/document-types/${id}`, data);
  }

  deleteDocumentType(id: string): Promise<any> {
    return AxiosInstance.delete(`/admin/v1/document-types/${id}`);
  }

  getDocumentType(id: string): Promise<any> {
    return AxiosInstance.get(`/admin/v1/document-types/${id}`);
  }

  createRole(data: Record<string, unknown>): Promise<any> {
    return AxiosInstance.post("/admin/v1/roles", data);
  }

  updateRole(id: string, data: Record<string, unknown>): Promise<any> {
    return AxiosInstance.put(`/admin/v1/roles/${id}`, data);
  }

  deleteRole(id: string): Promise<any> {
    return AxiosInstance.delete(`/admin/v1/roles/${id}`);
  }

  getOrgSettings(): Promise<any> {
    return AxiosInstance.get("/admin/v1/organization/settings");
  }

  updateOrgSettings(data: Record<string, unknown>): Promise<any> {
    return AxiosInstance.put("/admin/v1/organization/settings", data);
  }

  updateChatStatus(id: string, status: string): Promise<any> {
    return AxiosInstance.patch(`/admin/v1/chats/${id}/status`, { status });
  }

  deleteChat(id: string): Promise<any> {
    return AxiosInstance.delete(`/admin/v1/chats/${id}`);
  }

  deleteAllChats(params: Record<string, unknown> = {}): Promise<any> {
    return AxiosInstance.delete("/admin/v1/chats", { params });
  }

  getUsersBasic(params: Record<string, unknown> = {}): Promise<any> {
    return AxiosInstance.get("/admin/v1/users/basic", { params });
  }

  getCommandCenterStatus(): Promise<any> {
    return AxiosInstance.get("/admin/v1/command-center/status");
  }

  toggleMaintenanceMode(enabled: boolean): Promise<any> {
    return AxiosInstance.post("/admin/v1/command-center/toggle-maintenance", { enabled });
  }

  sendGlobalNotification(data: Record<string, unknown>): Promise<any> {
    return AxiosInstance.post("/admin/v1/command-center/global-notification", data);
  }

  impersonateOrg(organizationId: string): Promise<any> {
    return AxiosInstance.post("/admin/v1/command-center/impersonate", { organizationId });
  }

  clearSystemCache(): Promise<any> {
    return AxiosInstance.post("/admin/v1/command-center/clear-cache");
  }

  restartBackgroundJobs(): Promise<any> {
    return AxiosInstance.post("/admin/v1/command-center/restart-jobs");
  }

  backupDatabase(): Promise<any> {
    return AxiosInstance.post("/admin/v1/command-center/backup-db");
  }

  getGlobalSettings(): Promise<any> {
    return AxiosInstance.get("/admin/v1/global-settings");
  }

  updateGlobalSettings(data: Record<string, unknown>): Promise<any> {
    return AxiosInstance.put("/admin/v1/global-settings", data);
  }

  getOrgFullDetails(id: string): Promise<any> {
    return AxiosInstance.get(`/admin/v1/organizations/${id}/full-details`);
  }

  getOrgAnalytics(id: string): Promise<any> {
    return AxiosInstance.get(`/admin/v1/organizations/${id}/analytics`);
  }

  getKnowledgeGraphStats(): Promise<any> {
    return AxiosInstance.get("/admin/v1/knowledge-graph-stats");
  }

  createOrgApiKey(id: string, name: string): Promise<any> {
    return AxiosInstance.post(`/admin/v1/organizations/${id}/api-keys`, { name });
  }

  async revokeOrgApiKey(id: string, keyId: string): Promise<any> {
    return AxiosInstance.delete(`/admin/v1/organizations/${id}/api-keys/${keyId}`);
  }

  getPermissionCategories(): Promise<any> {
    return AxiosInstance.get("/admin/v1/permissions/categories");
  }

  // AI Config (own-org)
  getAIConfigs(): Promise<any> {
    return AxiosInstance.get("/admin/v1/ai-configs");
  }

  createAIConfig(data: Record<string, unknown>): Promise<any> {
    return AxiosInstance.post("/admin/v1/ai-configs", data);
  }

  updateAIConfig(id: string, data: Record<string, unknown>): Promise<any> {
    return AxiosInstance.put(`/admin/v1/ai-configs/${id}`, data);
  }

  deleteAIConfig(id: string): Promise<any> {
    return AxiosInstance.delete(`/admin/v1/ai-configs/${id}`);
  }

  testAIConfig(id: string): Promise<any> {
    return AxiosInstance.post(`/admin/v1/ai-configs/${id}/test`);
  }

  // Billing (own-org)
  getBilling(): Promise<any> {
    return AxiosInstance.get("/admin/v1/billing");
  }

  getInvoices(params: PaginationParams = {}): Promise<any> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    return AxiosInstance.get(`/admin/v1/billing/invoices?${searchParams.toString()}`);
  }

  downloadInvoiceUrl(invoiceId: string): string {
    const token = localStorage.getItem("auth_token") || "";
    return `/admin/v1/billing/invoices/${invoiceId}/download?token=${token}`;
  }

  changePlan(plan: string): Promise<any> {
    return AxiosInstance.post("/admin/v1/billing/change-plan", { plan });
  }

  // SuperAdmin Billing & Plan Customization
  getSuperAdminBillingOverview(): Promise<any> {
    return AxiosInstance.get("/admin/v1/superadmin/billing/overview");
  }

  getSuperAdminInvoices(params: Record<string, unknown> = {}): Promise<any> {
    return AxiosInstance.get("/admin/v1/superadmin/billing/invoices", { params });
  }

  getPlatformPlans(): Promise<any> {
    return AxiosInstance.get("/admin/v1/superadmin/billing/plans");
  }

  savePlatformPlan(data: any): Promise<any> {
    return AxiosInstance.post("/admin/v1/superadmin/billing/plans", data);
  }

  deletePlatformPlan(planKey: string): Promise<any> {
    return AxiosInstance.delete(`/admin/v1/superadmin/billing/plans/${planKey}`);
  }

  testGuardrails(text: string): Promise<any> {
    return AxiosInstance.post("/admin/v1/guardrails/test", { text });
  }

  // Analytics (own-org)
  getAnalyticsOverview(params: Record<string, unknown> = {}): Promise<any> {
    return AxiosInstance.get("/admin/v1/analytics/overview", { params });
  }

  getAiUsageAnalytics(params: Record<string, unknown> = {}): Promise<any> {
    return AxiosInstance.get("/admin/v1/analytics/ai-usage", { params });
  }

  // Org self-service API keys (own-org)
  getOrgApiKeys(): Promise<any> {
    return AxiosInstance.get("/admin/v1/organization/api-keys");
  }

  createOrgApiKeyForOrg(name: string): Promise<any> {
    return AxiosInstance.post("/admin/v1/organization/api-keys", { name });
  }

  revokeOrgApiKeyForOrg(keyId: string): Promise<any> {
    return AxiosInstance.delete(`/admin/v1/organization/api-keys/${keyId}`);
  }
}

export const AdminAPI = new AdminAPIClass();