import DocumentVerification from "../schema/DocumentVerification.schema.js";
import { updateDocumentStatus } from "./document.service.js";
export const createVerification = async ({ document_id, verified_by }) => {
  const existing = await DocumentVerification.findOne({
    document_id,
    status: "pending",
  });
  if (existing) throw new Error("A pending verification already exists for this document");

  return await DocumentVerification.create({
    document_id,
    verified_by,
    status: "pending",
  });
};

export const getVerificationByDocument = async (documentId) => {
  const verification = await DocumentVerification.findOne({
    document_id: documentId,
  })
    .populate("document_id", "file_name status")
    .populate("verified_by", "name email");

  if (!verification) throw new Error("Verification record not found");
  return verification;
};

export const getAllVerifications = async () => {
  return await DocumentVerification.find()
    .populate("document_id", "file_name status")
    .populate("verified_by", "name email")
    .sort({ verified_at: -1 });
};

export const getVerificationsByStatus = async (status) => {
  const allowed = ["pending", "verified", "rejected"];
  if (!allowed.includes(status)) throw new Error("Invalid verification status");

  return await DocumentVerification.find({ status })
    .populate("document_id", "file_name")
    .populate("verified_by", "name email");
};

export const approveVerification = async (verificationId, remarks = "") => {
  const verification = await DocumentVerification.findByIdAndUpdate(
    verificationId,
    {
      status: "verified",
      remarks,
      verified_at: new Date(),
    },
    { new: true }
  );
  if (!verification) throw new Error("Verification record not found");

  // Upon approval, update the document status
  const document = await updateDocumentStatus(verification.document_id, "approved");

  return verification;
};

export const rejectVerification = async (verificationId, remarks) => {
  if (!remarks) throw new Error("Rejection remarks are required");

  const verification = await DocumentVerification.findByIdAndUpdate(
    verificationId,
    {
      status: "rejected",
      remarks,
      verified_at: new Date(),
    },
    { new: true }
  );
  if (!verification) throw new Error("Verification record not found");
  return verification;
};

export const deleteVerification = async (verificationId) => {
  const verification = await DocumentVerification.findByIdAndDelete(verificationId);
  if (!verification) throw new Error("Verification record not found");
  return { message: "Verification record deleted" };
};
