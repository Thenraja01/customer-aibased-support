import {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  searchOrganizations,
} from "../service/organization.service.js";

// POST /organizations
export const create = async (req, res) => {
  try {
    const org = await createOrganization(req.body);
    res.status(201).json({ success: true, data: org });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /organizations
export const getAll = async (req, res) => {
  try {
    const orgs = await getAllOrganizations();
    res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /organizations/search?q=keyword
export const search = async (req, res) => {
  try {
    const orgs = await searchOrganizations(req.query.q || "");
    res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /organizations/:id
export const getById = async (req, res) => {
  try {
    const org = await getOrganizationById(req.params.id);
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    const status = error.message === "Organization not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// PUT /organizations/:id
export const update = async (req, res) => {
  try {
    const org = await updateOrganization(req.params.id, req.body);
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    const status = error.message === "Organization not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

// DELETE /organizations/:id
export const remove = async (req, res) => {
  try {
    const result = await deleteOrganization(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Organization not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
