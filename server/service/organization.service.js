import Organization from "../schema/Organizations.schema.js";

// Create a new organization
export const createOrganization = async (data) => {
  const existing = await Organization.findOne({ email: data.email });
  if (existing) throw new Error("Organization email already registered");

  return await Organization.create(data);
};

// Get all organizations
export const getAllOrganizations = async () => {
  return await Organization.find().sort({ created_at: -1 });
};

// Get a single organization by MongoDB _id
export const getOrganizationById = async (id) => {
  const org = await Organization.findById(id);
  if (!org) throw new Error("Organization not found");
  return org;
};

// Get by custom organization_id field
export const getOrganizationByOrgId = async (organizationId) => {
  const org = await Organization.findOne({ organization_id: organizationId });
  if (!org) throw new Error("Organization not found");
  return org;
};

// Update organization details
export const updateOrganization = async (id, data) => {
  const org = await Organization.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!org) throw new Error("Organization not found");
  return org;
};

// Delete an organization
export const deleteOrganization = async (id) => {
  const org = await Organization.findByIdAndDelete(id);
  if (!org) throw new Error("Organization not found");
  return { message: "Organization deleted successfully" };
};

// Search organizations by name
export const searchOrganizations = async (keyword) => {
  return await Organization.find({
    name: { $regex: keyword, $options: "i" },
  });
};
