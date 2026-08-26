import * as orgService from "./organization.service.js";

export const create = async (req, res) => {
  try {
    const org = await orgService.createOrganization(req.body);
    res.status(201).json({ success: true, data: org });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const orgs = await orgService.getAllOrganizations();
    res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const search = async (req, res) => {
  try {
    const orgs = await orgService.searchOrganizations(req.query.q || "");
    res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const org = await orgService.getOrganizationById(req.params.id);
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    const status = error.message === "Organization not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const org = await orgService.updateOrganization(req.params.id, req.body);
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    const status = error.message === "Organization not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await orgService.deleteOrganization(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Organization not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const removeAll = async (req, res) => {
  try {
    const result = await orgService.deleteAllOrganizations();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
