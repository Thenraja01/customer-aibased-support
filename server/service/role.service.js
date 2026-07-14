import Role from "../schema/role.schema.js";

// Create a new role
export const createRole = async (role_name) => {
  const existing = await Role.findOne({ role_name });
  if (existing) throw new Error("Role already exists");
  return await Role.create({ role_name });
};

// Get all roles
export const getAllRoles = async () => {
  return await Role.find().sort({ role_name: 1 });
};

// Get a role by ID
export const getRoleById = async (id) => {
  const role = await Role.findById(id);
  if (!role) throw new Error("Role not found");
  return role;
};

// Update a role name
export const updateRole = async (id, role_name) => {
  const role = await Role.findByIdAndUpdate(
    id,
    { role_name },
    { new: true, runValidators: true }
  );
  if (!role) throw new Error("Role not found");
  return role;
};

// Delete a role
export const deleteRole = async (id) => {
  const role = await Role.findByIdAndDelete(id);
  if (!role) throw new Error("Role not found");
  return { message: "Role deleted successfully" };
};
