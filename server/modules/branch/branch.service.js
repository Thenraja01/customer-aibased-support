import Branch from "./branch.schema.js";

export const createBranch = async (branchData) => {
  const { organization_id, name, code, address, phone, email, description } = branchData;
  const existing = await Branch.findOne({ organization_id, name: name.trim() });
  if (existing) throw new Error("Branch name already exists in this organization");

  const branch = await Branch.create({
    organization_id,
    name: name.trim(),
    code: code || name.trim().substring(0, 3).toUpperCase(),
    address,
    phone,
    email,
    description,
  });

  return branch;
};

export const getAllBranches = async (organizationId, page = 1, limit = 20) => {
  const filter = { organization_id: organizationId };
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Branch.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Branch.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

export const getBranchById = async (id, organizationId = null) => {
  const filter = { _id: id };
  if (organizationId) filter.organization_id = organizationId;
  const branch = await Branch.findOne(filter).populate("organization_id", "name");
  if (!branch) throw new Error("Branch not found");
  return branch;
};

export const updateBranch = async (id, branchData, organizationId = null) => {
  const filter = { _id: id };
  if (organizationId) filter.organization_id = organizationId;
  const branch = await Branch.findOneAndUpdate(filter, branchData, { new: true, runValidators: true });
  if (!branch) throw new Error("Branch not found");
  return branch;
};

export const deleteBranch = async (id, organizationId = null) => {
  const filter = { _id: id };
  if (organizationId) filter.organization_id = organizationId;
  const branch = await Branch.findOneAndDelete(filter);
  if (!branch) throw new Error("Branch not found");
  return { message: "Branch deleted successfully" };
};

export const searchBranches = async (query, organizationId, page = 1, limit = 20) => {
  const filter = {
    organization_id: organizationId,
    name: { $regex: query, $options: "i" },
  };
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Branch.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Branch.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};
