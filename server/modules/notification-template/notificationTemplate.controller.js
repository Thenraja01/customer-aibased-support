import * as ntService from "./notificationTemplate.service.js";

export const create = async (req, res) => {
  try {
    const data = { ...req.body, organization_id: req.organization?._id || req.user?.organization_id };
    const nt = await ntService.create(data);
    res.status(201).json({ success: true, data: nt });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const orgId = req.organization?._id || req.user?.organization_id;
    const templates = await ntService.getAll(orgId);
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const nt = await ntService.getById(req.params.id);
    res.status(200).json({ success: true, data: nt });
  } catch (error) {
    const status = error.message === "Notification template not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const nt = await ntService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: nt });
  } catch (error) {
    const status = error.message === "Notification template not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await ntService.remove(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Notification template not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
