import * as superAdminService from "./superAdmin.service.js";

export const getSystemStats = async (req, res) => {
  try {
    const stats = await superAdminService.getSystemStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSuperAdmin = async (req, res) => {
  try {
    const result = await superAdminService.createSuperAdmin(req.body, req.user.userId);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSuperAdmins = async (req, res) => {
  try {
    const admins = await superAdminService.getSuperAdmins();
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const suspendOrganization = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await superAdminService.suspendOrganization(
      req.params.id,
      req.user.userId,
      reason
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const activateOrganization = async (req, res) => {
  try {
    const result = await superAdminService.activateOrganization(
      req.params.id,
      req.user.userId
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOrganizationDetails = async (req, res) => {
  try {
    const details = await superAdminService.getOrganizationDetails(req.params.id);
    res.json({ success: true, data: details });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};