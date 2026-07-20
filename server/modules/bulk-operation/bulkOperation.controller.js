import * as bulkOperationService from "./bulkOperation.service.js";

export const create = async (req, res) => {
  try {
    const data = { ...req.body, user_id: req.user.userId, organization_id: req.user.organizationId };
    const operation = await bulkOperationService.createOperation(data);
    res.status(201).json({ success: true, data: operation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyOperations = async (req, res) => {
  try {
    const operations = await bulkOperationService.getMyOperations(req.user.userId);
    res.status(200).json({ success: true, data: operations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const operation = await bulkOperationService.getById(req.params.id);
    res.status(200).json({ success: true, data: operation });
  } catch (error) {
    const status = error.message === "Bulk operation not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const query = {};
    if (req.query.organization_id) query.organization_id = req.query.organization_id;
    const operations = await bulkOperationService.getAll(query);
    res.status(200).json({ success: true, data: operations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const operation = await bulkOperationService.updateStatus(req.params.id, req.body);
    res.status(200).json({ success: true, data: operation });
  } catch (error) {
    const status = error.message === "Bulk operation not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};
