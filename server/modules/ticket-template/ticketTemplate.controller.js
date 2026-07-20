import * as ttService from "./ticketTemplate.service.js";

export const create = async (req, res) => {
  try {
    const data = { ...req.body, organization_id: req.organization?._id || req.user?.organization_id };
    const t = await ttService.create(data);
    res.status(201).json({ success: true, data: t });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const orgId = req.organization?._id || req.user?.organization_id;
    const templates = await ttService.getAll(orgId);
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const t = await ttService.getById(req.params.id);
    res.status(200).json({ success: true, data: t });
  } catch (error) {
    const status = error.message === "Ticket template not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const t = await ttService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: t });
  } catch (error) {
    const status = error.message === "Ticket template not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await ttService.remove(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Ticket template not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
