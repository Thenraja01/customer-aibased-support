import AuditLog from "./auditLog.schema.js";

export const logAction = async (data) => {
  return await AuditLog.create(data);
};

export const getAllLogs = async () => {
  return await AuditLog.find()
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
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

export const deleteOldLogs = async (days = 90) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const result = await AuditLog.deleteMany({ created_at: { $lt: cutoff } });
  return { deleted: result.deletedCount };
};
