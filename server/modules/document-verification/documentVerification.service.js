import DocumentVerification from "./documentVerification.schema.js";
import Document from "../document/document.schema.js";
import { enqueueDocument } from "../../workers/rag.worker.js";

const buildDecisionPayload = (status, user, remarks) => ({
  status,
  verified_by: user?._id || user?.userId || user?.id,
  verified_role: user?.roleName || user?.role_name || user?.role,
  remarks: remarks || null,
  action_at: new Date(),
});

export const createVerification = async (data) => {
  const payload = {
    ...data,
    status: data.status || "pending",
    action_at: data.action_at || new Date(),
  };
  return await DocumentVerification.create(payload);
};

export const getVerificationByDocument = async (documentId, organizationId = null) => {
  const filter = { document_id: documentId };
  if (organizationId) filter.organization_id = organizationId;
  return await DocumentVerification.findOne(filter)
    .populate("verified_by", "name email")
    .lean();
};

export const getAllVerifications = async (organizationId = null) => {
  const filter = {};
  if (organizationId) filter.organization_id = organizationId;

  return await DocumentVerification.find(filter)
    .populate("document_id", "title file_name organization_id status")
    .populate("verified_by", "name email")
    .sort({ created_at: -1 })
    .lean();
};

export const getVerificationsByStatus = async (status, organizationId = null) => {
  const filter = { status };
  if (organizationId) filter.organization_id = organizationId;

  return await DocumentVerification.find(filter)
    .populate("document_id", "title file_name organization_id status")
    .populate("verified_by", "name email")
    .lean();
};

export const approveVerification = async (id, verifiedBy, remarks = "Approved") => {
  const verification = await DocumentVerification.findById(id);
  if (!verification) throw new Error("Verification not found");

  verification.status = "approved";
  verification.verified_by = verifiedBy?._id || verifiedBy?.id || verifiedBy?.userId;
  verification.verified_role = verifiedBy?.roleName || verifiedBy?.role_name || verifiedBy?.role;
  verification.remarks = remarks;
  verification.action_at = new Date();
  await verification.save();

  const document = await Document.findOne({
    _id: verification.document_id,
    is_deleted: { $ne: true },
  });
  if (!document) throw new Error("Document not found");

  document.status = "approved";
  document.verified_by = verification.verified_by;
  document.verified_at = new Date();
  document.approval_meta = {
    decision: "approved",
    decision_by: verification.verified_by,
    decision_role: verification.verified_role,
    decision_at: new Date(),
    decision_reason: remarks,
  };
  document.approval_history = [
    ...(document.approval_history || []),
    {
      action: "approved",
      decision_by: verification.verified_by,
      decision_role: verification.verified_role,
      decision_at: new Date(),
      decision_reason: remarks,
    },
  ];
  await document.save();

  if (document.is_knowledge_base && document.file_data) {
    const orgId = document.organization_id || verifiedBy?.organization_id;
    enqueueDocument(document._id, orgId, document.file_data, document.file_mimetype).catch((err) =>
      console.error("[RAG Pipeline] Queue error:", err.message)
    );
  }

  return verification;
};

export const rejectVerification = async (id, remarks, verifiedBy = null) => {
  const verification = await DocumentVerification.findById(id);
  if (!verification) throw new Error("Verification not found");

  verification.status = "rejected";
  verification.verified_by = verifiedBy?._id || verifiedBy?.id || verifiedBy?.userId || verification.verified_by;
  verification.verified_role = verifiedBy?.roleName || verifiedBy?.role_name || verifiedBy?.role || verification.verified_role;
  verification.remarks = remarks;
  verification.action_at = new Date();
  await verification.save();

  const document = await Document.findOne({
    _id: verification.document_id,
    is_deleted: { $ne: true },
  });
  if (!document) throw new Error("Document not found");

  document.status = "rejected";
  document.verified_by = verification.verified_by;
  document.verified_at = new Date();
  document.approval_meta = {
    decision: "rejected",
    decision_by: verification.verified_by,
    decision_role: verification.verified_role,
    decision_at: new Date(),
    decision_reason: remarks,
  };
  document.approval_history = [
    ...(document.approval_history || []),
    {
      action: "rejected",
      decision_by: verification.verified_by,
      decision_role: verification.verified_role,
      decision_at: new Date(),
      decision_reason: remarks,
    },
  ];
  await document.save();

  return verification;
};

export const deleteVerification = async (id) => {
  const v = await DocumentVerification.findByIdAndDelete(id);
  if (!v) throw new Error("Verification not found");
  return { message: "Verification deleted" };
};
