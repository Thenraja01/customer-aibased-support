import * as auditService from "./auditLog.service.js";

export const create = async (req, res) => {
  try {
    const log = await auditService.logAction(req.body);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const logs = await auditService.getAllLogs();
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByUser = async (req, res) => {
  try {
    const logs = await auditService.getLogsByUser(req.params.userId);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByTable = async (req, res) => {
  try {
    const logs = await auditService.getLogsByTable(req.params.tableName);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByRecord = async (req, res) => {
  try {
    const logs = await auditService.getLogsByRecord(req.params.tableName, req.params.recordId);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByAction = async (req, res) => {
  try {
    const logs = await auditService.getLogsByAction(req.params.action);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByDateRange = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ success: false, message: "from and to dates are required" });
    }
    const logs = await auditService.getLogsByDateRange(from, to);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cleanup = async (req, res) => {
  try {
    const days = Number(req.query.days) || 90;
    const result = await auditService.deleteOldLogs(days);
    res.status(200).json({ success: true, deleted: result.deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
