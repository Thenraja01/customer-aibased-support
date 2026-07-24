import TicketTemplate from "./ticketTemplate.schema.js";

export const createTemplate = async (data) => {
  return await TicketTemplate.create(data);
};

export const getTemplates = async (organizationId) => {
  return await TicketTemplate.find({ organization_id: organizationId }).sort({ created_at: -1 });
};

export const getActiveTemplates = async (organizationId) => {
  return await TicketTemplate.find({ organization_id: organizationId, is_active: true }).sort({ name: 1 });
};

export const getTemplateById = async (id) => {
  const template = await TicketTemplate.findById(id);
  if (!template) throw new Error("Template not found");
  return template;
};

export const updateTemplate = async (id, data) => {
  const template = await TicketTemplate.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!template) throw new Error("Template not found");
  return template;
};

export const deleteTemplate = async (id) => {
  const template = await TicketTemplate.findByIdAndDelete(id);
  if (!template) throw new Error("Template not found");
  return { message: "Template deleted" };
};
