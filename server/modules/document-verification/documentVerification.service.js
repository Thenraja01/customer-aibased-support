import DocumentVerification from "./documentVerification.schema.js";
import { updateDocumentStatus } from "../document/document.service.js";

export const createVerification = async (data) => {
  return await DocumentVerification.create(data);
};

export const getVerificationByDocument = async (documentId) => {
  return await DocumentVerification.findOne({ document_id: documentId })
    .populate("verified_by", "name email");
};

export const getAllVerifications = async () => {
  return await DocumentVerification.find()
    .populate("document_id", "title")
    .populate("verified_by", "name email")
    .sort({ created_at: -1 });
};

export const getVerificationsByStatus = async (status) => {
  return await DocumentVerification.find({ status })
    .populate("document_id", "title")
    .populate("verified_by", "name email");
};

export const approveVerification = async (id) => {
  const verification = await DocumentVerification.findByIdAndUpdate(
    id,
    { status: "approved" },
    { new: true }
  );
  if (!verification) throw new Error("Verification not found");
  await updateDocumentStatus(verification.document_id, { status: "approved" });
  return verification;
};

export const rejectVerification = async (id, remarks) => {
  const verification = await DocumentVerification.findByIdAndUpdate(
    id,
    { status: "rejected", remarks },
    { new: true }
  );
  if (!verification) throw new Error("Verification not found");
  await updateDocumentStatus(verification.document_id, { status: "rejected" });
  return verification;
};

export const deleteVerification = async (id) => {
  const v = await DocumentVerification.findByIdAndDelete(id);
  if (!v) throw new Error("Verification not found");
  return { message: "Verification deleted" };
};
