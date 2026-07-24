import * as templateService from "./ticketTemplate.service.js";

export const create = async (req, res) => {
  try {
    const data = { ...req.body, organization_id: req.user.organizationId };
    const template = await templateService.createTemplate(data);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const templates = await templateService.getTemplates(req.user.organizationId);
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActive = async (req, res) => {
  try {
    const templates = await templateService.getActiveTemplates(req.user.organizationId);
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const template = await templateService.getTemplateById(req.params.id);
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    const status = error.message === "Template not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const template = await templateService.updateTemplate(req.params.id, req.body);
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    const status = error.message === "Template not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await templateService.deleteTemplate(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Template not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
