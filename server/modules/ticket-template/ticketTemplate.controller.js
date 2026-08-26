import * as templateService from "./ticketTemplate.service.js";

export const create = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId || req.user?.organizationId || req.user?.organization_id;
    const branchId = req.scope?.branchId || req.user?.branchId || req.user?.branch_id || null;
    const template = await templateService.createTemplate(req.body, orgId, branchId);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId || req.user?.organizationId || req.user?.organization_id;
    const branchId = req.scope?.branchId || req.user?.branchId || req.user?.branch_id || null;
    const templates = await templateService.getAllTemplates(orgId, branchId);
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActive = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId || req.user?.organizationId || req.user?.organization_id;
    const branchId = req.scope?.branchId || req.user?.branchId || req.user?.branch_id || null;
    const templates = await templateService.getActiveTemplates(orgId, branchId);
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId || req.user?.organizationId || req.user?.organization_id;
    const template = await templateService.getTemplateById(req.params.id, orgId);
    if (!template) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId || req.user?.organizationId || req.user?.organization_id;
    const updated = await templateService.updateTemplate(req.params.id, req.body, orgId);
    if (!updated) return res.status(404).json({ success: false, message: "Template not found" });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId || req.user?.organizationId || req.user?.organization_id;
    await templateService.deleteTemplate(req.params.id, orgId);
    res.json({ success: true, message: "Template deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
