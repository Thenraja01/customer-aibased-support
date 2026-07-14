import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../service/role.service.js";

// POST /roles
export const create = async (req, res) => {
  try {
    const role = await createRole(req.body.role_name);
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /roles
export const getAll = async (req, res) => {
  try {
    const roles = await getAllRoles();
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /roles/:id
export const getById = async (req, res) => {
  try {
    const role = await getRoleById(req.params.id);
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    const status = error.message === "Role not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// PUT /roles/:id
export const update = async (req, res) => {
  try {
    const role = await updateRole(req.params.id, req.body.role_name);
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    const status = error.message === "Role not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

// DELETE /roles/:id
export const remove = async (req, res) => {
  try {
    const result = await deleteRole(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Role not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
