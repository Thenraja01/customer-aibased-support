import Document from "./document.schema.js";
import DocumentChunk from "./documentChunk.model.js";
import { deleteNodesByDocument, deleteEdgesByDocument } from "../knowledge-graph/knowledgeGraph.service.js";

export const createDocument = async (data) => {
  return await Document.create(data);
};

export const getAllDocuments = async (baseFilter = {}, options = {}) => {
  const { page, limit, status, typeId, search, sortBy, sortOrder } = options;
  const filter = { ...baseFilter };
  if (status) filter.status = status;
  if (typeId) filter.document_type_id = typeId;
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { title: { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
    ];
  }

  const sortField = sortBy || "created_at";
  const sortDir = sortOrder === "asc" ? 1 : -1;
  const sortObj = {};
  sortObj[sortField] = sortDir;

  if (page && limit) {
    const total = await Document.countDocuments(filter);
    const docs = await Document.find(filter)
      .populate("user_id", "name email")
      .populate("document_type_id", "name")
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const sanitized = docs.map((doc) => {
      const { file_data, ...rest } = doc;
      return rest;
    });
    return {
      data: sanitized,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  const docs = await Document.find(filter)
    .populate("user_id", "name email")
    .populate("document_type_id", "name")
    .sort(sortObj);
  return docs.map((doc) => {
    const obj = doc.toObject();
    delete obj.file_data;
    return obj;
  });
};

export const getDocumentById = async (id, includeFileData = false) => {
  const doc = await Document.findOne({ _id: id, is_deleted: { $ne: true } })
    .populate("user_id", "name email")
    .populate("document_type_id", "name");
  if (!doc) throw new Error("Document not found");
  if (!includeFileData) {
    const obj = doc.toObject();
    delete obj.file_data;
    return obj;
  }
  return doc;
};

export const getDocumentsByUser = async (userId, organizationId) => {
  const filter = { user_id: userId, is_deleted: { $ne: true } };
  if (organizationId) {
    filter.organization_id = organizationId;
  }
  const docs = await Document.find(filter)
    .select("-file_data")
    .sort({ created_at: -1 });
  return docs;
};

export const getDocumentsByStatus = async (status, organizationId) => {
  const filter = { status, is_deleted: { $ne: true } };
  if (organizationId) {
    filter.organization_id = organizationId;
  }
  const docs = await Document.find(filter)
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
  return docs.map((doc) => {
    const obj = doc.toObject();
    delete obj.file_data;
    return obj;
  });
};

export const updateDocument = async (id, data) => {
  const doc = await Document.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate("user_id", "name email")
    .populate("document_type_id", "name");
  if (!doc) throw new Error("Document not found");
  const obj = doc.toObject();
  delete obj.file_data;
  return obj;
};

export const updateDocumentStatus = async (id, status) => {
  const doc = await Document.findByIdAndUpdate(id, { status }, { new: true });
  if (!doc) throw new Error("Document not found");
  return doc;
};

export const deleteDocument = async (id) => {
  const doc = await Document.findByIdAndUpdate(
    id,
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
