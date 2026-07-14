import AuditLog from "../schema/AuditLog.schema.js";

// Create an audit log entry
export const logAction = async ({ user_id, action, table_name, record_id }) => {
  return await AuditLog.create({ user_id, action, table_name, record_id });
};

// Get all audit logs (admin)
export const getAllLogs = async () => {
  return await AuditLog.find()
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

// Get logs for a specific user
export const getLogsByUser = async (userId) => {
  return await AuditLog.find({ user_id: userId }).sort({ created_at: -1 });
};

// Get logs for a specific table (e.g., "Document", "Ticket")
export const getLogsByTable = async (tableName) => {
  return await AuditLog.find({ table_name: tableName })
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

// Get logs for a specific record
export const getLogsByRecord = async (tableName, recordId) => {
  return await AuditLog.find({ table_name: tableName, record_id: recordId })
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

// Get logs by action type (e.g., "CREATE", "UPDATE", "DELETE")
export const getLogsByAction = async (action) => {
  return await AuditLog.find({ action: { $regex: action, $options: "i" } })
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

// Get logs within a date range
export const getLogsByDateRange = async (from, to) => {
  return await AuditLog.find({
    created_at: { $gte: new Date(from), $lte: new Date(to) },
  })
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

// Delete logs older than N days (cleanup job)
export const deleteOldLogs = async (days = 90) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const result = await AuditLog.deleteMany({ created_at: { $lt: cutoff } });
  return { deleted: result.deletedCount };
};
