import Role from "./role.schema.js";

export const createRole = async (roleData) => {
  const { role_name, organization_id = null, permissions = [], status = 'active', description = '' } = roleData;

  if (role_name.trim().toLowerCase() === "super admin" || role_name.trim().toLowerCase() === "super_admin" ) {
    throw new Error("Cannot create super admin role");
  }

  const existing = await Role.findOne({ role_name: role_name.trim(), organization_id: organization_id || null });
  if (existing) throw new Error("Role already exists in this organization");

  return await Role.create({
    role_name: role_name.trim(),
    organization_id: organization_id || null,
    permissions,
    status,
    description
  });
};

export const getAllRoles = async (organizationId = null) => {
  const filter = organizationId
    ? { $or: [{ organization_id: organizationId }, { organization_id: null }] }
    : {};
  return await Role.find(filter).sort({ role_name: 1 });
};

export const getRoleById = async (id) => {
  const role = await Role.findById(id);
  if (!role) throw new Error("Role not found");
  return role;
};

export const getRoleByName = async (roleName, organizationId = null) => {
  const filter = { role_name: roleName.trim() };
  if (organizationId) filter.organization_id = organizationId;
  const role = await Role.findOne(filter);
  if (!role) throw new Error("Role not found");
  return role;
};

export const updateRole = async (id, roleData) => {
  const { role_name, permissions, status, description } = roleData;

  if (role_name && role_name.trim().toLowerCase() === "super admin") {
    throw new Error("Cannot rename role to super admin");
  }

  const existingRole = await Role.findById(id);
  if (!existingRole) throw new Error("Role not found");
  if (existingRole.role_name.toLowerCase() === "super admin") {
    throw new Error("Cannot modify super admin role");
  }

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
  return role;
};

export const deleteRole = async (id) => {
  const role = await Role.findById(id);
  if (!role) throw new Error("Role not found");
  if (role.role_name.toLowerCase() === "super admin") {
    throw new Error("Cannot delete super admin role");
  }
  await Role.findByIdAndDelete(id);
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