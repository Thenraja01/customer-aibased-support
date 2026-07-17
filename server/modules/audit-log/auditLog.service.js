import AuditLog from "./auditLog.schema.js";
import { escapeRegex } from "../../utils/escapeRegex.js";

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

export const getLogStats = async (from, to) => {
  const dateQuery = {};
  if (from) dateQuery.$gte = new Date(from);
  if (to) dateQuery.$lte = new Date(to);

  const matchStage = Object.keys(dateQuery).length > 0 ? { created_at: dateQuery } : {};

  const [total, byAction, byTable, byDay, byUser] = await Promise.all([
    AuditLog.countDocuments(matchStage),

    AuditLog.aggregate([
      { $match: matchStage },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),

    AuditLog.aggregate([
      { $match: matchStage },
      { $group: { _id: "$table_name", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    AuditLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]),

    AuditLog.aggregate([
      { $match: matchStage },
      { $group: { _id: "$user_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          count: 1,
          userName: "$user.name",
          userEmail: "$user.email",
        },
      },
    ]),
  ]);

  return { total, byAction, byTable, byDay, byUser };
};
