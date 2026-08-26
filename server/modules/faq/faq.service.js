import Faq from "./faq.schema.js";
import { normalizeRoleName, isNormalizedAdminRole } from "../../utils/constants.js";

export const createFaq = async (data, user, organizationId = null, branchId = null) => {
  const orgId = data.organization_id || organizationId || user.organizationId || user.organization_id?._id || user.organization_id;
  const bId = data.branch_id || branchId || user.branchId || user.branch_id?._id || user.branch_id;

  if (!orgId) throw new Error("Organization ID is required to create an FAQ");

  const payload = {
    ...data,
    organization_id: orgId,
    branch_id: bId || null,
    created_by: user.userId || user._id,
  };

  const role = normalizeRoleName(user.roleName || user.role);
  if (isNormalizedAdminRole(role) || role === "branch_admin") {
    payload.status = "approved";
    payload.approved_by = user.userId || user._id;
    payload.approved_at = new Date();
    payload.is_active = true;
  } else {
    payload.status = "pending";
  }

  return await Faq.create(payload);
};

export const getActiveFaqs = async (organizationId = null, branchId = null) => {
  const query = { is_active: true, status: "approved" };
  if (organizationId) query.organization_id = organizationId;
  if (branchId) {
    query.$or = [{ branch_id: branchId }, { branch_id: null }];
  }
  return await Faq.find(query).sort({ created_at: -1 });
};

export const getAllFaqs = async (organizationId = null, branchId = null) => {
  const filter = {};
  if (organizationId) filter.organization_id = organizationId;
  if (branchId) {
    filter.$or = [{ branch_id: branchId }, { branch_id: null }];
  }
  return await Faq.find(filter)
    .populate("organization_id", "name")
    .populate("branch_id", "name code")
    .populate("created_by", "name email")
    .populate("approved_by", "name email")
    .sort({ created_at: -1 });
};

export const getFaqsByStatus = async (status, organizationId = null, branchId = null) => {
  const filter = { status };
  if (organizationId) filter.organization_id = organizationId;
  if (branchId) {
    filter.$or = [{ branch_id: branchId }, { branch_id: null }];
  }
  return await Faq.find(filter)
    .populate("branch_id", "name code")
    .populate("created_by", "name email")
    .populate("approved_by", "name email")
    .sort({ created_at: -1 });
};

export const getFaqById = async (id) => {
  const faq = await Faq.findById(id)
    .populate("organization_id", "name")
    .populate("branch_id", "name code")
    .populate("created_by", "name email")
    .populate("approved_by", "name email");
  if (!faq) throw new Error("FAQ not found");
  return faq;
};

export const updateFaq = async (id, data) => {
  const faq = await Faq.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!faq) throw new Error("FAQ not found");
  return faq;
};

export const approveFaq = async (id, userId) => {
  const faq = await Faq.findByIdAndUpdate(
    id,
    { status: "approved", approved_by: userId, approved_at: new Date(), is_active: true },
    { new: true }
  );
  if (!faq) throw new Error("FAQ not found");
  return faq;
};

export const rejectFaq = async (id) => {
  const faq = await Faq.findByIdAndUpdate(
    id,
    { status: "rejected" },
    { new: true }
  );
  if (!faq) throw new Error("FAQ not found");
  return faq;
};

export const getFaqsByUser = async (userId, organizationId = null, branchId = null) => {
  const filter = { created_by: userId };
  if (organizationId) filter.organization_id = organizationId;
  if (branchId) filter.branch_id = branchId;
  return await Faq.find(filter)
    .populate("created_by", "name email")
    .populate("approved_by", "name email")
    .sort({ created_at: -1 });
};

export const deleteFaq = async (id) => {
  const faq = await Faq.findByIdAndDelete(id);
  if (!faq) throw new Error("FAQ not found");
  return { message: "FAQ deleted" };
};
