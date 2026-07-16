import * as roleService from "./role.service.js";

export const create = async (req, res) => {
  try {
    const role = await roleService.createRole(req.body.role_name);
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const roles = await roleService.getAllRoles();
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const role = await roleService.getRoleById(req.params.id);
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    const status = error.message === "Role not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const role = await roleService.updateRole(req.params.id, req.body.role_name);
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    const status = error.message === "Role not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await roleService.deleteRole(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Role not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
