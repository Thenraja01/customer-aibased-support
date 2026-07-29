import * as branchService from "./branch.service.js";

export const create = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const branch = await branchService.createBranch({ ...req.body, organization_id: orgId });
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    const status = error.message.includes("already exists") ? 409 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await branchService.getAllBranches(orgId, page, limit);
    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const orgId = req.user.roleName === "super_admin" ? null : req.user.organizationId;
    const branch = await branchService.getBranchById(req.params.id, orgId);
    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    const status = error.message === "Branch not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const branch = await branchService.updateBranch(req.params.id, req.body, orgId);
    res.status(200).json({ success: true, data: branch });
  } catch (error) {
    const status = error.message === "Branch not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const result = await branchService.deleteBranch(req.params.id, orgId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Branch not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const search = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const q = req.query.q || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await branchService.searchBranches(q, orgId, page, limit);
    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
