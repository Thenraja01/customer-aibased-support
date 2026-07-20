import TicketTemplate from "./ticketTemplate.schema.js";

export const create = async (data) => {
  return await TicketTemplate.create(data);
};

export const getAll = async (organizationId) => {
  const filter = { organization_id: organizationId };
  return await TicketTemplate.find(filter).sort({ name: 1 });
};

export const getById = async (id) => {
  const t = await TicketTemplate.findById(id);
  if (!t) throw new Error("Ticket template not found");
  return t;
};

export const update = async (id, data) => {
  const t = await TicketTemplate.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!t) throw new Error("Ticket template not found");
  return t;
};

export const remove = async (id) => {
  const t = await TicketTemplate.findByIdAndDelete(id);
  if (!t) throw new Error("Ticket template not found");
  return { message: "Ticket template deleted" };
};
