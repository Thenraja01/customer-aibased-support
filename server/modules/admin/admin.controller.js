import * as adminService from "./admin.service.js";
import * as orgService from "../organization/organization.service.js";
import * as userService from "../user/user.service.js";
import * as roleService from "../role/role.service.js";

export const dashboardStats = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super admin";
    const orgId = isSuperAdmin ? null : req.user?.organizationId;
    const stats = await adminService.getDashboardStats(orgId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrganizations = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await adminService.getAllOrgsPaginated(Number(page) || 1, Number(limit) || 10, search || "");
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOrg = async (req, res) => {
  try {
    const org = await orgService.createOrganization(req.body);
    res.status(201).json({ success: true, data: org });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateOrg = async (req, res) => {
  try {
    const org = await orgService.updateOrganization(req.params.id, req.body);
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    const status = error.message === "Organization not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const deleteOrg = async (req, res) => {
  try {
    const result = await orgService.deleteOrganization(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Organization not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getOrganizationUsers = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getOrgUsers(req.params.id, Number(page) || 1, Number(limit) || 10);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { page, limit, search, status } = req.query;
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super admin";
    const result = await adminService.getAllUsersPaginated(
      Number(page) || 1,
      Number(limit) || 10,
      search || "",
      status || "",
      isSuperAdmin ? null : req.user?.organizationId
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, message: "User created", data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const editUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const patchUserStatus = async (req, res) => {
  try {
    const user = await userService.updateUserStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const removeUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "User not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getRoles = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super admin";
    const orgId = isSuperAdmin ? null : req.user?.organizationId;
    const result = await adminService.getAllRolesPaginated(Number(page) || 1, Number(limit) || 10, orgId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addRole = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super admin";
    const roleData = { ...req.body };
    if (!isSuperAdmin) {
      roleData.organization_id = req.user?.organizationId;
    }
    const role = await roleService.createRole(roleData);
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const editRole = async (req, res) => {
  try {
    const role = await roleService.updateRole(req.params.id, req.body);
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    const status = error.message === "Role not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const removeRole = async (req, res) => {
  try {
    const result = await roleService.deleteRole(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Role not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { page, limit, userId, action, tableName, from, to } = req.query;
    const result = await adminService.getAuditLogsPaginated(Number(page) || 1, Number(limit) || 20, { userId, action, tableName, from, to });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDocuments = async (req, res) => {
  try {
    const { page, limit, status, assigned_role, search } = req.query;
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super admin";
    const result = await adminService.getDocumentsPaginated(
      Number(page) || 1,
      Number(limit) || 10,
      {
        status,
        assigned_role,
        search,
        organizationId: isSuperAdmin ? undefined : req.user?.organizationId,
      }
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const doc = await adminService.getDocumentById(req.params.id);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getDocumentChunks = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getDocumentChunks(
      req.params.id,
      Number(page) || 1,
      Number(limit) || 20
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDocumentVerifications = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const result = await adminService.getDocumentVerificationsPaginated(
      Number(page) || 1,
      Number(limit) || 10,
      status || ""
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveDocument = async (req, res) => {
  try {
    const result = await adminService.approveDocumentVerification(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    const status = error.message === "Verification not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const rejectDocument = async (req, res) => {
  try {
    const { remarks } = req.body;
    const result = await adminService.rejectDocumentVerification(req.params.id, remarks);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    const status = error.message === "Verification not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getRAGStats = async (req, res) => {
  try {
    const stats = await adminService.getRAGStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getKnowledgeGraphStats = async (req, res) => {
  try {
    const stats = await adminService.getKnowledgeGraphStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDocumentTypes = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await adminService.getDocumentTypesPaginated(
      Number(page) || 1,
      Number(limit) || 10,
      search || ""
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDocumentType = async (req, res) => {
  try {
    const dt = await adminService.createDocumentType(req.body);
    res.status(201).json({ success: true, data: dt });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDocumentType = async (req, res) => {
  try {
    const dt = await adminService.updateDocumentType(req.params.id, req.body);
    res.status(200).json({ success: true, data: dt });
  } catch (error) {
    const status = error.message === "Document type not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const deleteDocumentType = async (req, res) => {
  try {
    const result = await adminService.deleteDocumentType(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Document type not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const suspendOrg = async (req, res) => {
  try {
    const org = await adminService.suspendOrganization(req.params.id);
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const activateOrg = async (req, res) => {
  try {
    const org = await adminService.activateOrganization(req.params.id);
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getUsageStats = async (req, res) => {
  try {
    const stats = await adminService.getUsageStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createOrgApiKey = async (req, res) => {
  try {
    const result = await adminService.createApiKey(req.params.id, req.body.name);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const revokeOrgApiKey = async (req, res) => {
  try {
    const result = await adminService.revokeApiKey(req.params.id, req.params.keyId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Organization not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getOrgSettings = async (req, res) => {
  try {
    const orgId = req.params.orgId || req.user?.organizationId;
    const settings = await adminService.getOrganizationSettings(orgId);
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    const status = error.message === "Organization not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const updateOrgSettings = async (req, res) => {
  try {
    const orgId = req.params.orgId || req.user?.organizationId;
    const settings = await adminService.updateOrganizationSettings(orgId, req.body);
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    const status = error.message === "Organization not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getChats = async (req, res) => {
  try {
    const { page, limit, search, status, from, to, userId, stats } = req.query;
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super admin";
    const result = await adminService.getAllChatsPaginated(
      Number(page) || 1,
      Number(limit) || 10,
      { search, status, from, to, userId },
      isSuperAdmin ? null : req.user?.organizationId,
      stats === "true"
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getChatDetail = async (req, res) => {
  try {
    const chat = await adminService.getChatDetail(req.params.id);
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    const status = error.message === "Chat not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const result = await adminService.deleteChat(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Chat not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getUsersBasic = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super admin";
    const users = await adminService.getAllUsersBasic(isSuperAdmin ? null : req.user?.organizationId);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCommandCenterStatus = async (req, res) => {
  try {
    const status = await adminService.getCommandCenterStatus();
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleMaintenanceMode = async (req, res) => {
  try {
    const { enabled } = req.body;
    const result = await adminService.toggleMaintenanceMode(enabled);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendGlobalNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const result = await adminService.sendGlobalNotification({ title, message, type, senderId: req.user?._id });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const impersonateOrg = async (req, res) => {
  try {
    const { organizationId } = req.body;
    const result = await adminService.impersonateOrganization(organizationId, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const clearSystemCache = async (req, res) => {
  try {
    const result = await adminService.clearSystemCache();
    res.status(200).json({ success: true, message: result.message, timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const restartBackgroundJobs = async (req, res) => {
  try {
    const result = await adminService.restartBackgroundJobs();
    res.status(200).json({ success: true, message: result.message, timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const backupDatabase = async (req, res) => {
  try {
    const result = await adminService.backupDatabase();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrgFullDetails = async (req, res) => {
  try {
    const details = await adminService.getOrganizationFullDetails(req.params.id);
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    const status = error.message === "Organization not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getGlobalSettings = async (req, res) => {
  try {
    const settings = await adminService.getGlobalSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGlobalSettings = async (req, res) => {
  try {
    const settings = await adminService.updateGlobalSettings(req.body);
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOrgAnalytics = async (req, res) => {
  try {
    const analytics = await adminService.getOrganizationAnalytics(req.params.id);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

