import Document from "./document.schema.js";
import DocumentChunk from "./documentChunk.model.js";
import { deleteNodesByDocument, deleteEdgesByDocument } from "../knowledge-graph/knowledgeGraph.service.js";

const buildFilter = (baseFilter = {}, options = {}) => {
  const filter = { ...baseFilter };
  const { status, typeId, search } = options;

  if (status) filter.status = status;
  if (typeId) filter.document_type_id = typeId;
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
      { file_name: { $regex: safe, $options: "i" } },
    ];
  }
  return filter;
};

const stripFileData = (doc) => {
  if (!doc) return doc;
  if (Array.isArray(doc)) {
    return doc.map(stripFileData);
  }
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.file_data;
  return obj;
};

export const createDocument = async (data) => {
  const payload = {
    ...data,
    status: data.status || (data.is_knowledge_base ? "pending_review" : "draft"),
    approval_meta: data.approval_meta || { decision: data.status || "pending_review" },
  };
  return await Document.create(payload);
};

export const getAllDocuments = async (baseFilter = {}, options = {}) => {
  const { page, limit, sortBy, sortOrder } = options;
  const filter = buildFilter(baseFilter, options);

  const sortField = sortBy || "created_at";
  const sortDir = sortOrder === "asc" ? 1 : -1;
  const sortObj = { [sortField]: sortDir };

  if (page && limit) {
    const total = await Document.countDocuments(filter);
    const docs = await Document.find(filter)
      .populate("user_id", "name email")
      .populate("document_type_id", "name")
      .populate("organization_id", "name slug")
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      data: stripFileData(docs),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  const docs = await Document.find(filter)
    .populate("user_id", "name email")
    .populate("document_type_id", "name")
    .populate("organization_id", "name slug")
    .sort(sortObj)
    .lean();

  return stripFileData(docs);
};

export const getDocumentById = async (id, includeFileData = false, organizationId = null) => {
  const filter = { _id: id, is_deleted: { $ne: true } };
  if (organizationId) filter.organization_id = organizationId;

  const doc = await Document.findOne(filter)
    .populate("user_id", "name email")
    .populate("document_type_id", "name")
    .populate("organization_id", "name slug");

  if (!doc) throw new Error("Document not found");
  if (!includeFileData) return stripFileData(doc);
  return doc;
};

export const getDocumentsByUser = async (userId, organizationId) => {
  const filter = { user_id: userId, is_deleted: { $ne: true } };
  if (organizationId) filter.organization_id = organizationId;

  const docs = await Document.find(filter)
    .select("-file_data")
    .sort({ created_at: -1 })
    .lean();
  return docs;
};

export const getDocumentsByStatus = async (status, organizationId) => {
  const filter = { status, is_deleted: { $ne: true } };
  if (organizationId) filter.organization_id = organizationId;

  const docs = await Document.find(filter)
    .populate("user_id", "name email")
    .sort({ created_at: -1 })
    .lean();
  return stripFileData(docs);
};

export const updateDocument = async (id, data, organizationId = null) => {
  const filter = { _id: id };
  if (organizationId) filter.organization_id = organizationId;

  const doc = await Document.findOneAndUpdate(filter, data, { new: true, runValidators: true })
    .populate("user_id", "name email")
    .populate("document_type_id", "name")
    .populate("organization_id", "name slug");
  if (!doc) throw new Error("Document not found");
  return stripFileData(doc);
};

export const updateDocumentStatus = async (id, status, meta = {}, organizationId = null) => {
  const update = {
    status,
    approval_meta: {
      decision: status,
      decision_by: meta.decision_by || null,
      decision_role: meta.decision_role || null,
      decision_at: meta.decision_at || new Date(),
      decision_reason: meta.decision_reason || null,
    },
  };

  if (status === "approved" || status === "rejected") {
    update.verified_by = meta.decision_by || null;
    update.verified_at = meta.decision_at || new Date();
  }

  const filter = { _id: id };
  if (organizationId) filter.organization_id = organizationId;

  const doc = await Document.findOneAndUpdate(filter, update, { new: true });
  if (!doc) throw new Error("Document not found");
  return doc;
};

export const deleteDocument = async (id, organizationId = null) => {
  const filter = { _id: id };
  if (organizationId) filter.organization_id = organizationId;

  const doc = await Document.findOneAndUpdate(
    filter,
    { is_deleted: true, deleted_at: new Date() },
    { new: true }
  );
  if (!doc) throw new Error("Document not found");
  return { message: "Document soft-deleted" };
};

export const hardDeleteDocument = async (id) => {
  const doc = await Document.findByIdAndDelete(id);
  if (!doc) throw new Error("Document not found");
  await Promise.all([
    DocumentChunk.deleteMany({ document_id: id }),
    deleteNodesByDocument(id),
    deleteEdgesByDocument(id),
  ]);
  return { message: "Document and related data permanently deleted" };
};
