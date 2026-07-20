import DocumentCategory from "./documentCategory.schema.js";

export const createCategory = async (data) => {
  return await DocumentCategory.create(data);
};

export const getAllCategories = async (query = {}) => {
  const filter = {};
  if (query.organization_id) filter.organization_id = query.organization_id;
  if (query.is_active !== undefined) filter.is_active = query.is_active === "true";
  return await DocumentCategory.find(filter)
    .populate("organization_id", "name")
    .sort({ name: 1 });
};

export const getCategoryById = async (id) => {
  const category = await DocumentCategory.findById(id).populate("organization_id", "name");
  if (!category) throw new Error("Document category not found");
  return category;
};

export const updateCategory = async (id, data) => {
  const category = await DocumentCategory.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!category) throw new Error("Document category not found");
  return category;
};

export const deleteCategory = async (id) => {
  const category = await DocumentCategory.findByIdAndDelete(id);
  if (!category) throw new Error("Document category not found");
  return { message: "Document category deleted" };
};
