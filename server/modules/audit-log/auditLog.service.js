import AuditLog from "./auditLog.schema.js";

export const logAction = async (data) => {
  return await AuditLog.create(data);
};

export const logSecurityViolation = async ({ userId, tenantId, attemptedTenantId, action = "CROSS_TENANT_ACCESS_ATTEMPT", details = "" }) => {
  return await AuditLog.create({
    user_id: userId,
    organization_id: tenantId,
    action: action,
    table_name: "SECURITY_EVENT",
    status: "DENIED",
    new_values: { attempted_tenant: attemptedTenantId, details },
  }).catch(() => null);
};

export const createAuditLog = logAction;

export const getAllLogs = async (query = {}) => {
  return await AuditLog.find(query)
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const getLogsByQuery = async (query = {}) => {
  return await AuditLog.find(query)
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const getLogsPaginated = async (page = 1, limit = 20, query = {}) => {
  const total = await AuditLog.countDocuments(query);
  const logs = await AuditLog.find(query)
    .populate("user_id", "name email")
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: logs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getLogsByUser = async (userId) => {
  return await AuditLog.find({ user_id: userId })
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const getLogsByTable = async (tableName) => {
  return await AuditLog.find({ table_name: tableName })
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const getLogsByRecord = async (tableName, recordId) => {
  return await AuditLog.find({ table_name: tableName, record_id: recordId })
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const getLogsByAction = async (action) => {
  return await AuditLog.find({ action })
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const getLogsByDateRange = async (from, to) => {
  return await AuditLog.find({
    created_at: { $gte: new Date(from), $lte: new Date(to) },
  })
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const deleteOldLogs = async (days = 90, query = {}) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const combinedQuery = { ...query, created_at: { $lt: cutoff } };
  const result = await AuditLog.deleteMany(combinedQuery);
  return { deleted: result.deletedCount };
};
