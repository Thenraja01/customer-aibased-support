import {
  logAction,
  getAllLogs,
  getLogsByUser,
  getLogsByTable,
  getLogsByRecord,
  getLogsByAction,
  getLogsByDateRange,
  deleteOldLogs,
} from "../service/auditLog.service.js";

// POST /audit-logs (internal use — called from other controllers)
export const create = async (req, res) => {
  try {
    const log = await logAction(req.body);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /audit-logs
export const getAll = async (req, res) => {
  try {
    const logs = await getAllLogs();
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /audit-logs/user/:userId
export const getByUser = async (req, res) => {
  try {
    const logs = await getLogsByUser(req.params.userId);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /audit-logs/table/:tableName
export const getByTable = async (req, res) => {
  try {
    const logs = await getLogsByTable(req.params.tableName);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /audit-logs/record/:tableName/:recordId
export const getByRecord = async (req, res) => {
  try {
    const logs = await getLogsByRecord(req.params.tableName, req.params.recordId);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /audit-logs/action/:action
export const getByAction = async (req, res) => {
  try {
    const logs = await getLogsByAction(req.params.action);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /audit-logs/range?from=2024-01-01&to=2024-12-31
export const getByDateRange = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ success: false, message: "from and to dates are required" });
    }
    const logs = await getLogsByDateRange(from, to);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /audit-logs/cleanup?days=90
export const cleanup = async (req, res) => {
  try {
    const days = Number(req.query.days) || 90;
    const result = await deleteOldLogs(days);
    res.status(200).json({ success: true, deleted: result.deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
