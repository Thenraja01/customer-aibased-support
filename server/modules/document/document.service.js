import fs from "fs";
import path from "path";
import Document from "./document.schema.js";
import DocumentChunk from "./documentChunk.schema.js";
import DocumentVerification from "../document-verification/documentVerification.schema.js";
import { deleteNodesByDocument, deleteEdgesByDocument } from "../knowledge-graph/knowledgeGraph.service.js";
import { ingestDocument } from "../rag/rag.service.js";
import { extractTextFromFile } from "../../utils/extractText.utils.js";

export const createDocument = async (data, userId) => {
  const doc = await Document.create(data);
  await DocumentVerification.create({
    document_id: doc._id,
    verified_by: userId,
    status: "pending",
  });
  return doc;
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

export const approveDocument = async (id, userId) => {
  const now = new Date();
  const doc = await Document.findByIdAndUpdate(
    id,
    { status: "approved", approvedBy: userId, approvedAt: now },
    { new: true }
  ).populate("document_type_id");
  if (!doc) throw new Error("Document not found");
  await DocumentVerification.findOneAndUpdate(
    { document_id: id },
    { status: "approved", verified_by: userId },
    { upsert: true, new: true }
  );
  runIngestion(doc).catch((err) => console.error("Ingestion failed:", err.message));
  return doc;
};

const runIngestion = async (doc) => {
  let filePath = doc.file_url?.startsWith("/uploads/")
    ? path.resolve("." + doc.file_url)
    : null;
  if (!filePath || !fs.existsSync(filePath)) return;
  const text = await extractTextFromFile(filePath, "");
  if (text.trim().length < 10) return;
  await ingestDocument(doc._id, doc.organization_id, text);
};

export const rejectDocument = async (id, userId, remarks) => {
  const doc = await Document.findByIdAndUpdate(id, { status: "rejected" }, { new: true });
  if (!doc) throw new Error("Document not found");
  await DocumentVerification.findOneAndUpdate(
    { document_id: id },
    { status: "rejected", verified_by: userId, remarks: remarks || "" },
    { upsert: true, new: true }
  );
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
