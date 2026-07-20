import BulkOperation from "./bulkOperation.schema.js";

export const createOperation = async (data) => {
  return await BulkOperation.create(data);
};

export const getMyOperations = async (userId) => {
  return await BulkOperation.find({ user_id: userId })
    .populate("organization_id", "name")
    .sort({ created_at: -1 });
};

export const getById = async (id) => {
  const operation = await BulkOperation.findById(id)
    .populate("organization_id", "name")
    .populate("user_id", "name email");
  if (!operation) throw new Error("Bulk operation not found");
  return operation;
};

export const getAll = async (query = {}) => {
  return await BulkOperation.find(query)
    .populate("organization_id", "name")
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const updateStatus = async (id, data) => {
  const update = { ...data };
  if (data.status === "completed" || data.status === "failed") {
    update.completed_at = new Date();
  }
  const operation = await BulkOperation.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });
  if (!operation) throw new Error("Bulk operation not found");
  return operation;
};
