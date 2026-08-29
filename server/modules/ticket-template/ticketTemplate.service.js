import TicketTemplate from "./ticketTemplate.schema.js";

export const createTemplate = async (data, organizationId, branchId = null) => {
  return await TicketTemplate.create({
    ...data,
    organization_id: organizationId,
    branch_id: branchId || data.branch_id || null,
  });
};

export const getAllTemplates = async (organizationId, branchId = null) => {
  const query = { organization_id: organizationId };
  if (branchId) {
    query.$or = [{ branch_id: branchId }, { branch_id: null }];
  }
  return await TicketTemplate.find(query).sort({ created_at: -1 }).lean();
};

export const getActiveTemplates = async (organizationId, branchId = null) => {
  const query = { organization_id: organizationId, is_active: true };
  if (branchId) {
    query.$or = [{ branch_id: branchId }, { branch_id: null }];
  }
  return await TicketTemplate.find(query).sort({ name: 1 }).lean();
};

export const getTemplateById = async (id, organizationId) => {
  return await TicketTemplate.findOne({ _id: id, organization_id: organizationId }).lean();
};

export const updateTemplate = async (id, data, organizationId) => {
  return await TicketTemplate.findOneAndUpdate(
    { _id: id, organization_id: organizationId },
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
};

export const deleteTemplate = async (id, organizationId) => {
  return await TicketTemplate.findOneAndDelete({ _id: id, organization_id: organizationId });
};
