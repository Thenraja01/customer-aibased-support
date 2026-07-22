import User from "../user/user.schema.js";
import Organization from "../organization/organization.schema.js";
import Role from "../role/role.schema.js";
import AuditLog from "../audit-log/auditLog.schema.js";
import Document from "../document/document.schema.js";
import DocumentChunk from "../document/documentChunk.schema.js";
import DocumentVerification from "../document-verification/documentVerification.schema.js";
import DocumentType from "../document-type/documentType.schema.js";
import { getRAGStats as getRAGStatsFromService } from "../rag/rag.service.js";
import { getGraphStats as getGraphStatsFromService } from "../knowledge-graph/knowledgeGraph.service.js";
import { escapeRegex } from "../../utils/escapeRegex.js";

export const getDashboardStats = async () => {
  const [totalUsers, totalOrgs, totalRoles, recentLogs, blockedUsers, activeUsers] =
    await Promise.all([
      User.countDocuments(),
      Organization.countDocuments(),
      Role.countDocuments(),
      AuditLog.countDocuments(),
      User.countDocuments({ status: "blocked" }),
      User.countDocuments({ status: "active" }),
    ]);

  const orgs = await Organization.find()
    .select("name organization_id")
    .lean();

  const orgUserCounts = await User.aggregate([
    { $group: { _id: "$organization_id", count: { $sum: 1 } } },
  ]);

  const orgStats = orgs.map((org) => {
    const match = orgUserCounts.find(
      (o) => o._id.toString() === org._id.toString()
    );
    return {
      organizationId: org._id,
      name: org.name,
      organization_id: org.organization_id,
      userCount: match ? match.count : 0,
    };
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentActivity = await AuditLog.countDocuments({
    created_at: { $gte: sevenDaysAgo },
  });

  return {
    totalUsers,
    totalOrgs,
    totalRoles,
    blockedUsers,
    activeUsers,
    recentLogs,
    recentActivity,
    orgStats,
  };
};

export const getAllOrgsPaginated = async (page = 1, limit = 10, search = "") => {
  const query = search ? { name: { $regex: escapeRegex(search), $options: "i" } } : {};
  const total = await Organization.countDocuments(query);
  const orgs = await Organization.find(query)
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: orgs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getOrgUsers = async (orgId, page = 1, limit = 10) => {
  const query = { organization_id: orgId };
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .populate("role_id", "role_name")
    .select("-password")
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: users,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getAllUsersPaginated = async (page = 1, limit = 10, search = "", status = "") => {
  const query = {};
  if (search) {
    const safe = escapeRegex(search);
    query.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
  }
  if (status) query.status = status;
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .populate("organization_id", "name email")
    .populate("role_id", "role_name")
    .select("-password")
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: users,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getAllRolesPaginated = async (page = 1, limit = 10) => {
  const total = await Role.countDocuments();
  const roles = await Role.find()
    .sort({ role_name: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: roles,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getAuditLogsPaginated = async (page = 1, limit = 20, filters = {}) => {
  const query = {};
  if (filters.userId) query.user_id = filters.userId;
  if (filters.action) query.action = { $regex: escapeRegex(filters.action), $options: "i" };
  if (filters.tableName) query.table_name = filters.tableName;
  if (filters.from || filters.to) {
    query.created_at = {};
    if (filters.from) query.created_at.$gte = new Date(filters.from);
    if (filters.to) query.created_at.$lte = new Date(filters.to);
  }
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

export const getDocumentsPaginated = async (page = 1, limit = 10, filters = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.assigned_role) query.assigned_role = filters.assigned_role;
  if (filters.search) {
    const safe = escapeRegex(filters.search);
    query.$or = [
      { title: { $regex: safe, $options: "i" } },
      { file_name: { $regex: safe, $options: "i" } },
    ];
  }
  const total = await Document.countDocuments(query);
  const docs = await Document.find(query)
    .populate("user_id", "name email")
    .populate("document_type_id", "name")
    .populate("organization_id", "name")
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: docs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getDocumentById = async (id) => {
  const doc = await Document.findById(id)
    .populate("user_id", "name email")
    .populate("document_type_id", "name")
    .populate("organization_id", "name")
    .populate("approved_by", "name email");
  if (!doc) throw new Error("Document not found");
  return doc;
};

export const getDocumentChunks = async (documentId, page = 1, limit = 20) => {
  const query = { document_id: documentId };
  const total = await DocumentChunk.countDocuments(query);
  const chunks = await DocumentChunk.find(query)
    .sort({ chunk_index: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: chunks,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getDocumentVerificationsPaginated = async (page = 1, limit = 10, status = "") => {
  const query = status ? { status } : {};
  const total = await DocumentVerification.countDocuments(query);
  const verifications = await DocumentVerification.find(query)
    .populate("document_id", "title file_name status assigned_role")
    .populate("verified_by", "name email")
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: verifications,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const approveDocumentVerification = async (verificationId) => {
  const verification = await DocumentVerification.findByIdAndUpdate(
    verificationId,
    { status: "approved" },
    { new: true }
  );
  if (!verification) throw new Error("Verification not found");
  
  const doc = await Document.findByIdAndUpdate(
    verification.document_id,
    { status: "approved" },
    { new: true }
  );
  
  await DocumentChunk.updateMany(
    { document_id: verification.document_id },
    { status: "approved", assigned_role: doc?.assigned_role || "All" }
  );
  return verification;
};

export const rejectDocumentVerification = async (verificationId, remarks) => {
  const verification = await DocumentVerification.findByIdAndUpdate(
    verificationId,
    { status: "rejected", remarks: remarks || "" },
    { new: true }
  );
  if (!verification) throw new Error("Verification not found");
  
  const doc = await Document.findByIdAndUpdate(
    verification.document_id,
    { status: "rejected" },
    { new: true }
  );
  
  await DocumentChunk.updateMany(
    { document_id: verification.document_id },
    { status: "rejected", assigned_role: doc?.assigned_role || "All" }
  );
  return verification;
};

export const getRAGStats = async () => {
  return await getRAGStatsFromService();
};

export const getKnowledgeGraphStats = async () => {
  return await getGraphStatsFromService();
};

export const getDocumentTypesPaginated = async (page = 1, limit = 10, search = "") => {
  const query = search ? { name: { $regex: escapeRegex(search), $options: "i" } } : {};
  const total = await DocumentType.countDocuments(query);
  const types = await DocumentType.find(query)
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: types,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const createDocumentType = async (data) => {
  return await DocumentType.create(data);
};

export const updateDocumentType = async (id, data) => {
  const dt = await DocumentType.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!dt) throw new Error("Document type not found");
  return dt;
};

export const deleteDocumentType = async (id) => {
  const dt = await DocumentType.findByIdAndDelete(id);
  if (!dt) throw new Error("Document type not found");
  return { message: "Document type deleted" };
};
