import * as qrService from "./quickReply.service.js";

export const create = async (req, res) => {
  try {
    const data = { ...req.body, organization_id: req.organization?._id || req.user?.organization_id };
    const qr = await qrService.create(data);
    res.status(201).json({ success: true, data: qr });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const orgId = req.organization?._id || req.user?.organization_id;
    const { category, active } = req.query;
    const replies = await qrService.getAll(orgId, { category, active });
    res.status(200).json({ success: true, data: replies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const qr = await qrService.getById(req.params.id);
    res.status(200).json({ success: true, data: qr });
  } catch (error) {
    const status = error.message === "Quick reply not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const qr = await qrService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: qr });
  } catch (error) {
    const status = error.message === "Quick reply not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await qrService.remove(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Quick reply not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
