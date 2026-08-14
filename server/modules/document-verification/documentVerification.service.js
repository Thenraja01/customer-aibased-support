import DocumentVerification from "./documentVerification.schema.js";
import Document from "../document/document.schema.js";
import { updateDocumentStatus } from "../document/document.service.js";

export const createVerification = async (data) => {
  return await DocumentVerification.create(data);
};

export const getVerificationByDocument = async (documentId) => {
  return await DocumentVerification.findOne({ document_id: documentId })
    .populate("verified_by", "name email");
};

/**
 * Tenant-scoped listing. `organizationId` is required: verifications must never
 * leak across organizations (they resolve document_id → document.organization_id).
 */
export const getAllVerifications = async (organizationId = null) => {
  const filter = {};
  if (organizationId) {
    const docs = await Document.find({ organization_id: organizationId }).select("_id").lean();
    filter.document_id = { $in: docs.map((d) => d._id) };
  }
  return await DocumentVerification.find(filter)
    .populate("document_id", "title")
    .populate("verified_by", "name email")
    .sort({ created_at: -1 });
};

export const getVerificationsByStatus = async (status, organizationId = null) => {
  const filter = { status };
  if (organizationId) {
    const docs = await Document.find({ organization_id: organizationId }).select("_id").lean();
    filter.document_id = { $in: docs.map((d) => d._id) };
  }
  return await DocumentVerification.find(filter)
    .populate("document_id", "title")
    .populate("verified_by", "name email");
};

export const approveVerification = async (id, userId = null) => {
  const verification = await DocumentVerification.findByIdAndUpdate(
    id,
    { status: "approved", verified_by: userId },
    { new: true }
  );
  if (!verification) throw new Error("Verification not found");
  await Document.findByIdAndUpdate(verification.document_id, {
    verification_status: "approved",
    verified_by: userId,
    verified_at: new Date(),
  });
  await updateDocumentStatus(verification.document_id, { status: "approved" });
  return verification;
};

export const rejectVerification = async (id, remarks, userId = null) => {
  const verification = await DocumentVerification.findByIdAndUpdate(
    id,
    { status: "rejected", remarks, verified_by: userId },
    { new: true }
  );
  if (!verification) throw new Error("Verification not found");
  await Document.findByIdAndUpdate(verification.document_id, {
    verification_status: "rejected",
    verified_by: userId,
    verified_at: new Date(),
    rejection_reason: remarks || "",
  });
  await updateDocumentStatus(verification.document_id, { status: "rejected" });
  return verification;
};

export const deleteVerification = async (id) => {
  const v = await DocumentVerification.findByIdAndDelete(id);
  if (!v) throw new Error("Verification not found");
  return { message: "Verification deleted" };
};
