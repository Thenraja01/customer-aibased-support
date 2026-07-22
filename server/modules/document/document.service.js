import Document from "./document.schema.js";
import DocumentChunk from "./documentChunk.schema.js";
import DocumentVerification from "../document-verification/documentVerification.schema.js";
import { deleteNodesByDocument, deleteEdgesByDocument } from "../knowledge-graph/knowledgeGraph.service.js";
import { ingestDocument } from "../rag/rag.service.js";
import { extractTextFromBuffer } from "../../utils/extractText.utils.js";
import { uploadFileToGridFS, getFileFromGridFS, deleteFileFromGridFS } from "../../services/gridfs.service.js";

export const createDocument = async (data, userId, fileBuffer, fileName, fileMimeType) => {
  const gridFSId = await uploadFileToGridFS(fileBuffer, fileName, fileMimeType);
  
  const doc = await Document.create({
    ...data,
    assigned_role: (data.assigned_role || "all").toLowerCase(),
    file_id: gridFSId,
    file_name: fileName,
    file_mimetype: fileMimeType,
    file_size: fileBuffer.length,
  });
  
  await DocumentVerification.create({
    document_id: doc._id,
    verified_by: userId,
    status: "pending",
  });
  
  const fileBufferFromGridFS = await getFileFromGridFS(gridFSId);
  const text = await extractTextFromBuffer(fileBufferFromGridFS, fileMimeType);
  
  if (text.trim().length >= 10) {
    await ingestDocument(doc._id, doc.organization_id, doc.assigned_role || "all", text, doc.status || "draft");
  }
  
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

export const updateDocumentStatus = async (id, updateData) => {
  const doc = await Document.findByIdAndUpdate(id, updateData, { new: true });
  if (!doc) throw new Error("Document not found");
  
  const chunkUpdate = {};
  if (updateData.status) chunkUpdate.status = updateData.status;
  if (updateData.assigned_role) chunkUpdate.assigned_role = updateData.assigned_role.toLowerCase();
  if (Object.keys(chunkUpdate).length > 0) {
    await DocumentChunk.updateMany({ document_id: id }, chunkUpdate);
  }
  
  return doc;
};

export const approveDocument = async (id, userId) => {
  const now = new Date();
  const doc = await Document.findByIdAndUpdate(
    id,
    { status: "approved", approved_by: userId, approved_at: now },
    { new: true }
  ).populate("document_type_id");
  if (!doc) throw new Error("Document not found");
  await DocumentVerification.findOneAndUpdate(
    { document_id: id },
    { status: "approved", verified_by: userId },
    { upsert: true, new: true }
  );
  await DocumentChunk.updateMany(
    { document_id: id },
    { status: "approved", assigned_role: (doc.assigned_role || "all").toLowerCase() }
  );
  runIngestion(doc).catch((err) => console.error("Ingestion failed:", err.message));
  return doc;
};

const runIngestion = async (doc) => {
  if (!doc.file_id) return;
  
  const fileBuffer = await getFileFromGridFS(doc.file_id);
  const text = await extractTextFromBuffer(fileBuffer, doc.file_mimetype);
  
  if (text.trim().length < 10) return;
  
  await DocumentChunk.deleteMany({ document_id: doc._id });
  await ingestDocument(doc._id, doc.organization_id, doc.assigned_role || "all", text, doc.status || "approved");
};

export const rejectDocument = async (id, userId, remarks) => {
  const doc = await Document.findByIdAndUpdate(id, { status: "rejected" }, { new: true });
  if (!doc) throw new Error("Document not found");
  await DocumentVerification.findOneAndUpdate(
    { document_id: id },
    { status: "rejected", verified_by: userId, remarks: remarks || "" },
    { upsert: true, new: true }
  );
  await DocumentChunk.updateMany(
    { document_id: id },
    { status: "rejected", assigned_role: (doc.assigned_role || "all").toLowerCase() }
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
    doc.file_id ? deleteFileFromGridFS(doc.file_id) : Promise.resolve(),
  ]);
  
  return { message: "Document and related data deleted" };
};
