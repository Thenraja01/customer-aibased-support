// role.service.js
import Role from "./role.schema.js";

export const createRole = async (roleData) => {
  const { role_name, permissions = [], status = 'active', description = '' } = roleData;
  
  // Check if role already exists
  const existing = await Role.findOne({ role_name: role_name.trim() });
  if (existing) throw new Error("Role already exists");
  
  // Create the role
  return await Role.create({ 
    role_name: role_name.trim(), 
    permissions,
    status,
    description
  });
};

export const getAllRoles = async () => {
  return await Role.find().sort({ role_name: 1 });
};

export const getRoleById = async (id) => {
  const role = await Role.findById(id);
  if (!role) throw new Error("Role not found");
  return role;
};

export const getRoleByName = async (roleName) => {
  const role = await Role.findOne({ role_name: roleName.trim() });
  if (!role) throw new Error("Role not found");
  return role;
};

export const updateRole = async (id, roleData) => {
  const { role_name, permissions, status, description } = roleData;
  
  const updateData = {};
  if (role_name) updateData.role_name = role_name.trim();
  if (permissions) updateData.permissions = permissions;
  if (status) updateData.status = status;
  if (description) updateData.description = description;
  
  const role = await Role.findByIdAndUpdate(
    id,
    updateData,
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

export const initializeRoles = async () => {
  const defaultRoles = [
    {
      role_name: "super admin",
      permissions: ["*"],
      status: "active",
      description: "Super administrator with full system access"
    },
    {
      role_name: "tenant admin",
      permissions: [
        "manage_users",
        "manage_documents",
        "manage_document_types",
        "view_analytics",
        "manage_organizations"
      ],
      status: "active",
      description: "Tenant administrator with limited system access"
    },
    {
      role_name: "user",
      permissions: [
        "view_documents",
        "upload_documents",
        "view_own_profile"
      ],
      status: "active",
      description: "Regular user with basic access"
    }
  ];

  const results = [];
  for (const roleData of defaultRoles) {
    const existing = await Role.findOne({ role_name: roleData.role_name });
    if (!existing) {
      const role = await Role.create(roleData);
      results.push({ created: true, role });
    } else {
      results.push({ created: false, role: existing });
    }
  }
  return results;
};