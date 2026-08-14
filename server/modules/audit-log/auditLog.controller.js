import * as auditService from "./auditLog.service.js";
import { escapeRegex } from "../../utils/escapeRegex.js";

const buildScopeQuery = (req) => {
  const query = {};
  const { isSuperAdmin, organizationId, branchId } = req.scope || {};

  if (isSuperAdmin) {
    return query;
  }

  if (organizationId) {
    query.organization_id = organizationId;
  }
  if (branchId && !req.scope?.isOrgAdmin) {
    query.branch_id = branchId;
  }
  return query;
};

export const create = async (req, res) => {
  try {
    const { organizationId, branchId } = req.scope || {};
    const logData = {
      ...req.body,
      organization_id: req.body.organization_id || organizationId || null,
      branch_id: req.body.branch_id || branchId || null,
    };
    const log = await auditService.logAction(logData);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const scopeQuery = buildScopeQuery(req);
    const logs = await auditService.getAllLogs(scopeQuery);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaginated = async (req, res) => {
  try {
    const { page = 1, limit = 20, userId, action, tableName, from, to } = req.query;
    const scopeQuery = buildScopeQuery(req);

    if (userId) scopeQuery.user_id = userId;
    if (action) scopeQuery.action = { $regex: escapeRegex(action), $options: "i" };
    if (tableName) scopeQuery.table_name = tableName;
    if (from || to) {
      scopeQuery.created_at = {};
      if (from) scopeQuery.created_at.$gte = new Date(from);
      if (to) scopeQuery.created_at.$lte = new Date(to);
    }

    const result = await auditService.getLogsPaginated(
      Number(page),
      Number(limit),
      scopeQuery
    );
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByUser = async (req, res) => {
  try {
    const scopeQuery = buildScopeQuery(req);
    scopeQuery.user_id = req.params.userId;
    const logs = await auditService.getLogsByQuery(scopeQuery);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByTable = async (req, res) => {
  try {
    const scopeQuery = buildScopeQuery(req);
    scopeQuery.table_name = req.params.tableName;
    const logs = await auditService.getLogsByQuery(scopeQuery);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByRecord = async (req, res) => {
  try {
    const scopeQuery = buildScopeQuery(req);
    scopeQuery.table_name = req.params.tableName;
    scopeQuery.record_id = req.params.recordId;
    const logs = await auditService.getLogsByQuery(scopeQuery);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByAction = async (req, res) => {
  try {
    const scopeQuery = buildScopeQuery(req);
    scopeQuery.action = req.params.action;
    const logs = await auditService.getLogsByQuery(scopeQuery);
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
    const scopeQuery = buildScopeQuery(req);
    scopeQuery.created_at = { $gte: new Date(from), $lte: new Date(to) };
    const logs = await auditService.getLogsByQuery(scopeQuery);
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cleanup = async (req, res) => {
  try {
    const days = Number(req.query.days) || 90;
    const scopeQuery = buildScopeQuery(req);
    const result = await auditService.deleteOldLogs(days, scopeQuery);
    res.status(200).json({ success: true, deleted: result.deleted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
