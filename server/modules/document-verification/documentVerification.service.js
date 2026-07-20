import DocumentVerification from "./documentVerification.schema.js";
import { updateDocumentStatus, getDocumentById } from "../document/document.service.js";
import { enqueueDocument } from "../../workers/rag.worker.js";
import * as docService from "../document/document.service.js";

export const createVerification = async (data) => {
  return await DocumentVerification.create(data);
};

export const getVerificationByDocument = async (documentId) => {
  return await DocumentVerification.findOne({ document_id: documentId })
    .populate("verified_by", "name email");
};

export const getAllVerifications = async () => {
  return await DocumentVerification.find()
    .populate("document_id", "title file_name organization_id")
    .populate("verified_by", "name email")
    .sort({ created_at: -1 });
};

export const getVerificationsByStatus = async (status) => {
  return await DocumentVerification.find({ status })
    .populate("document_id", "title file_name organization_id")
    .populate("verified_by", "name email");
};

export const approveVerification = async (id, verifiedBy) => {
  const verification = await DocumentVerification.findByIdAndUpdate(
    id,
    { status: "approved", verified_by: verifiedBy?._id || verifiedBy?.id },
    { new: true }
  );
  if (!verification) throw new Error("Verification not found");
  await updateDocumentStatus(verification.document_id, "approved");

  const doc = await docService.getDocumentById(verification.document_id, true);
  if (doc && doc.is_knowledge_base && doc.file_data) {
    const orgId = doc.organization_id || verifiedBy?.organization_id;
    enqueueDocument(doc._id, orgId, doc.file_data, doc.file_mimetype)
      .catch(err => console.error("[RAG Pipeline] Queue error:", err.message));
  }

  return verification;
};

export const rejectVerification = async (id, remarks) => {
  const verification = await DocumentVerification.findByIdAndUpdate(
    id,
    { status: "rejected", remarks },
    { new: true }
  );
  if (!verification) throw new Error("Verification not found");
  await updateDocumentStatus(verification.document_id, "rejected");
  return verification;
};

export const deleteVerification = async (id) => {
  const v = await DocumentVerification.findByIdAndDelete(id);
  if (!v) throw new Error("Verification not found");
  return { message: "Verification deleted" };
};
