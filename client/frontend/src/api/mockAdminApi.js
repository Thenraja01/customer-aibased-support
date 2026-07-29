import { AdminAPI } from "./admin.api";
import { MOCK } from "./mockData";

const tryOrMock = async (apiCall, mockData) => {
  try {
    const res = await apiCall();
    if (res.data?.success) return res;
    throw new Error("API returned unsuccessful");
  } catch {
    return mockData;
  }
};

export const MockAdminAPI = {
  // Dashboard
  getDashboardStats: () => tryOrMock(
    () => AdminAPI.getDashboardStats(),
    MOCK.success(MOCK.dashboardStats),
  ),

  // Organizations
  getOrganizations: (params) => tryOrMock(
    () => AdminAPI.getOrganizations(params),
    MOCK.success(MOCK.organizations),
  ),
  createOrganization: (data) => tryOrMock(
    () => AdminAPI.createOrganization(data),
    MOCK.success({ _id: `org-new-${Date.now()}`, ...data, organization_id: `ORG-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, created_at: new Date().toISOString() }),
  ),
  updateOrganization: (id, data) => tryOrMock(
    () => AdminAPI.updateOrganization(id, data),
    MOCK.success({ _id: id, ...data }),
  ),
  deleteOrganization: (id) => tryOrMock(
    () => AdminAPI.deleteOrganization(id),
    MOCK.success(null),
  ),
  getOrgUsers: (id, params) => tryOrMock(
    () => AdminAPI.getOrgUsers(id, params),
    MOCK.success([MOCK.orgUsers(id)]),
  ),

  // Users
  getUsers: (params) => tryOrMock(
    () => AdminAPI.getUsers(params),
    MOCK.success(MOCK.users),
  ),
  createUser: (data) => tryOrMock(
    () => AdminAPI.createUser(data),
    MOCK.success({ _id: `u-new-${Date.now()}`, ...data, created_at: new Date().toISOString() }),
  ),
  updateUser: (id, data) => tryOrMock(
    () => AdminAPI.updateUser(id, data),
    MOCK.success({ _id: id, ...data }),
  ),
  updateUserStatus: (id, status) => tryOrMock(
    () => AdminAPI.updateUserStatus(id, status),
    MOCK.success({ _id: id, status }),
  ),
  deleteUser: (id) => tryOrMock(
    () => AdminAPI.deleteUser(id),
    MOCK.success(null),
  ),

  // Roles
  getRoles: (params) => tryOrMock(
    () => AdminAPI.getRoles(params),
    MOCK.success(MOCK.roles),
  ),
  createRole: (data) => tryOrMock(
    () => AdminAPI.createRole(data),
    MOCK.success({ _id: `r-new-${Date.now()}`, ...data }),
  ),
  updateRole: (id, data) => tryOrMock(
    () => AdminAPI.updateRole(id, data),
    MOCK.success({ _id: id, ...data }),
  ),
  deleteRole: (id) => tryOrMock(
    () => AdminAPI.deleteRole(id),
    MOCK.success(null),
  ),

  // Audit Logs
  getAuditLogs: (params) => tryOrMock(
    () => AdminAPI.getAuditLogs(params),
    MOCK.success(MOCK.auditLogs),
  ),

  // Organization Settings
  getOrgSettings: () => tryOrMock(
    () => AdminAPI.getOrgSettings(),
    MOCK.success(MOCK.globalSettings),
  ),
  updateOrgSettings: (data) => tryOrMock(
    () => AdminAPI.updateOrgSettings(data),
    MOCK.success({ ...MOCK.globalSettings, ...data }),
  ),

  // Command Center
  getCommandCenterStatus: () => tryOrMock(
    () => AdminAPI.getCommandCenterStatus(),
    MOCK.success(MOCK.commandCenterStatus),
  ),
  toggleMaintenanceMode: (enabled) => tryOrMock(
    () => AdminAPI.toggleMaintenanceMode(enabled),
    MOCK.success({ message: `Maintenance mode ${enabled ? "enabled" : "disabled"} successfully.` }),
  ),
  sendGlobalNotification: (data) => tryOrMock(
    () => AdminAPI.sendGlobalNotification(data),
    MOCK.success({ message: "Global notification sent to all active users." }),
  ),
  impersonateOrg: (organizationId) => tryOrMock(
    () => AdminAPI.impersonateOrg(organizationId),
    MOCK.success({ message: `Impersonating organization ${organizationId}.` }),
  ),
  clearSystemCache: () => tryOrMock(
    () => AdminAPI.clearSystemCache(),
    MOCK.success({ message: "System cache cleared successfully. 1.2MB freed." }),
  ),
  restartBackgroundJobs: () => tryOrMock(
    () => AdminAPI.restartBackgroundJobs(),
    MOCK.success({ message: "Background jobs restarted. 4 workers active." }),
  ),
  backupDatabase: () => tryOrMock(
    () => AdminAPI.backupDatabase(),
    MOCK.success({ snapshotId: `snap-${Date.now()}`, sizeEstimate: "256 MB", summary: { organizations: 12, users: 2847, documents: 15420 } }),
  ),

  // Global Settings
  getGlobalSettings: () => tryOrMock(
    () => AdminAPI.getGlobalSettings(),
    MOCK.success(MOCK.globalSettings),
  ),
  updateGlobalSettings: (data) => tryOrMock(
    () => AdminAPI.updateGlobalSettings(data),
    MOCK.success({ ...MOCK.globalSettings, ...data }),
  ),

  // Organization Details & Analytics
  getOrgFullDetails: (id) => tryOrMock(
    () => AdminAPI.getOrgFullDetails(id),
    MOCK.successDetail(MOCK.orgFullDetails(id)),
  ),
  getOrgAnalytics: (id) => tryOrMock(
    () => AdminAPI.getOrgAnalytics(id),
    MOCK.successDetail(MOCK.orgAnalytics),
  ),

  // Knowledge Graph
  getKnowledgeGraphStats: () => tryOrMock(
    () => AdminAPI.getKnowledgeGraphStats(),
    MOCK.success(MOCK.knowledgeGraphStats),
  ),

  // Pending Org Admins
  getPendingOrgAdmins: () => tryOrMock(
    () => AdminAPI.getPendingOrgAdmins(),
    MOCK.success([]),
  ),
  approveOrgAdmin: (id) => tryOrMock(
    () => AdminAPI.approveOrgAdmin(id),
    MOCK.success({ _id: id, status: "approved" }),
  ),
  rejectOrgAdmin: (id, reason) => tryOrMock(
    () => AdminAPI.rejectOrgAdmin(id, reason),
    MOCK.success({ _id: id, status: "rejected" }),
  ),
};
