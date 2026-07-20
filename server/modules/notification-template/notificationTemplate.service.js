import NotificationTemplate from "./notificationTemplate.schema.js";

export const create = async (data) => {
  return await NotificationTemplate.create(data);
};

export const getAll = async (organizationId) => {
  const filter = { organization_id: organizationId };
  return await NotificationTemplate.find(filter).sort({ name: 1 });
};

export const getById = async (id) => {
  const nt = await NotificationTemplate.findById(id);
  if (!nt) throw new Error("Notification template not found");
  return nt;
};

export const update = async (id, data) => {
  const nt = await NotificationTemplate.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!nt) throw new Error("Notification template not found");
  return nt;
};

export const remove = async (id) => {
  const nt = await NotificationTemplate.findByIdAndDelete(id);
  if (!nt) throw new Error("Notification template not found");
  return { message: "Notification template deleted" };
};
