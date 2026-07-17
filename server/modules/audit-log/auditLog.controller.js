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

export const getStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    const stats = await auditService.getLogStats(from, to);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportLogs = async (req, res) => {
  try {
    const { from, to, action, tableName, userId } = req.query;
    const query = {};
    if (userId) query.user_id = userId;
    if (action) query.action = action;
    if (tableName) query.table_name = tableName;
    if (from || to) {
      query.created_at = {};
      if (from) query.created_at.$gte = new Date(from);
      if (to) query.created_at.$lte = new Date(to);
    }

    const AuditLog = (await import("./auditLog.schema.js")).default;
    const logs = await AuditLog.find(query)
      .populate("user_id", "name email")
      .sort({ created_at: -1 })
      .limit(10000)
      .lean();

    const csvRows = ["Date,User,Email,Action,Table,Record ID"];
    for (const log of logs) {
      csvRows.push([
        new Date(log.created_at).toISOString(),
        log.user_id?.name || "System",
        log.user_id?.email || "",
        log.action || "",
        log.table_name || "",
        log.record_id || "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");
    res.status(200).send(csvRows.join("\n"));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
