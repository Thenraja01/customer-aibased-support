import DocumentAccessControl from "./documentAccessControl.schema.js";

export const createAccess = async (data) => {
  return await DocumentAccessControl.create(data);
};

export const getByDocument = async (documentId) => {
  return await DocumentAccessControl.find({ document_id: documentId })
    .populate("role_id", "name")
    .populate("user_id", "name email");
};

export const getAll = async (query = {}) => {
  return await DocumentAccessControl.find(query)
    .populate("document_id", "name")
    .populate("role_id", "name")
    .populate("user_id", "name email");
};

export const updateAccess = async (id, data) => {
  const access = await DocumentAccessControl.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!access) throw new Error("Access control entry not found");
  return access;
};

export const deleteAccess = async (id) => {
  const access = await DocumentAccessControl.findByIdAndDelete(id);
  if (!access) throw new Error("Access control entry not found");
  return { message: "Access control entry deleted" };
};
