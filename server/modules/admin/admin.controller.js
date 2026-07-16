import * as adminService from "./admin.service.js";
import * as orgService from "../organization/organization.service.js";
import * as userService from "../user/user.service.js";
import * as roleService from "../role/role.service.js";

export const dashboardStats = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
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
    const result = await adminService.getAllUsersPaginated(Number(page) || 1, Number(limit) || 10, search || "", status || "");
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
    const result = await adminService.getAllRolesPaginated(Number(page) || 1, Number(limit) || 10);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addRole = async (req, res) => {
  try {
    const role = await roleService.createRole(req.body.role_name);
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const editRole = async (req, res) => {
  try {
    const role = await roleService.updateRole(req.params.id, req.body.role_name);
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
