import QuickReply from "./quickReply.schema.js";

export const create = async (data) => {
  return await QuickReply.create(data);
};

export const getAll = async (organizationId, options = {}) => {
  const { category, active } = options;
  const filter = { organization_id: organizationId };
  if (category) filter.category = category;
  if (active !== undefined) filter.is_active = active === "true";

  return await QuickReply.find(filter).sort({ category: 1, title: 1 });
};

export const getById = async (id) => {
  const qr = await QuickReply.findById(id);
  if (!qr) throw new Error("Quick reply not found");
  return qr;
};

export const update = async (id, data) => {
  const qr = await QuickReply.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!qr) throw new Error("Quick reply not found");
  return qr;
};

export const remove = async (id) => {
  const qr = await QuickReply.findByIdAndDelete(id);
  if (!qr) throw new Error("Quick reply not found");
  return { message: "Quick reply deleted" };
};
