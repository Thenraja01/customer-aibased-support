import Document from "./document.schema.js";
import DocumentChunk from "./documentChunk.schema.js";
import { deleteNodesByDocument, deleteEdgesByDocument } from "../knowledge-graph/knowledgeGraph.service.js";

export const createDocument = async (data) => {
  return await Document.create(data);
};

export const getAllDocuments = async () => {
  return await Document.find()
    .populate("user_id", "name email")
    .populate("document_type_id", "name")
    .sort({ created_at: -1 });
};

export const getDocumentById = async (id) => {
  const doc = await Document.findById(id)
    .populate("user_id", "name email")
    .populate("document_type_id", "name");
  if (!doc) throw new Error("Document not found");
  return doc;
};

export const getDocumentsByUser = async (userId) => {
  return await Document.find({ user_id: userId }).sort({ created_at: -1 });
};

export const getDocumentsByStatus = async (status) => {
  return await Document.find({ status })
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const updateDocumentStatus = async (id, status) => {
  const doc = await Document.findByIdAndUpdate(id, { status }, { new: true });
  if (!doc) throw new Error("Document not found");
  return doc;
};

export const deleteDocument = async (id) => {
  const doc = await Document.findByIdAndDelete(id);
  if (!doc) throw new Error("Document not found");
  await Promise.all([
    DocumentChunk.deleteMany({ document_id: id }),
    deleteNodesByDocument(id),
    deleteEdgesByDocument(id),
  ]);
  return { message: "Document and related data deleted" };
};
