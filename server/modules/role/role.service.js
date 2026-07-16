import Role from "./role.schema.js";

export const createRole = async (roleName) => {
  const existing = await Role.findOne({ role_name: roleName });
  if (existing) throw new Error("Role already exists");
  return await Role.create({ role_name: roleName });
};

export const getAllRoles = async () => {
  return await Role.find().sort({ role_name: 1 });
};

export const getRoleById = async (id) => {
  const role = await Role.findById(id);
  if (!role) throw new Error("Role not found");
  return role;
};

export const updateRole = async (id, roleName) => {
  const role = await Role.findByIdAndUpdate(
    id,
    { role_name: roleName },
    { new: true, runValidators: true }
  );
  if (!role) throw new Error("Role not found");
  return role;
};

export const deleteRole = async (id) => {
  const role = await Role.findByIdAndDelete(id);
  if (!role) throw new Error("Role not found");
  return { message: "Role deleted successfully" };
};
