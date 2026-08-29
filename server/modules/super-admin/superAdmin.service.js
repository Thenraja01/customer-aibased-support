import User from "../user/user.schema.js";
import Organization from "../organization/organization.schema.js";
import { logAction } from "../audit-log/auditLog.service.js";

/**
 * Check if a user is a Super Admin
 */
export const isSuperAdmin = (user) => {
  if (!user) return false;
  return user.role === "super_admin" || user.roleName === "super_admin";
};

/**
 * Get all Super Admins in the system
 */
export const getSuperAdmins = async () => {
  return await User.find({ role: "super_admin" }).select("name email status created_at").lean();
};

/**
 * Create a new Super Admin (only existing Super Admin can do this)
 */
export const createSuperAdmin = async (adminData, createdBy) => {
  const { name, email, password } = adminData;
  
  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }
  
  const defaultOrg = await Organization.findOne();
  const organizationId = defaultOrg ? defaultOrg._id : null;

  // Create user
  const bcrypt = (await import("bcrypt")).default;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    auth_type: "local",
    status: "active",
    email_verified: true,
    email_verified_at: new Date(),
    organization_id: organizationId,
    role: "super_admin"
  });
  
  await logAction({
    user_id: createdBy,
    organization_id: null,
    action: "super_admin_created",
    table_name: "users",
    record_id: user._id.toString(),
    new_value: { email: user.email, name: user.name, role: "super_admin" },
  });
  
  return { message: "Super Admin created successfully", data: { userId: user._id, email: user.email } };
};

/**
 * Get system-wide statistics for Super Admin dashboard
 */
export const getSystemStats = async () => {
  const [
    totalOrganizations,
    activeOrganizations,
    suspendedOrganizations,
    totalUsers,
    activeUsers,
    pendingUsers,
    totalRoles,
  ] = await Promise.all([
    Organization.countDocuments(),
    Organization.countDocuments({ status: "active" }),
    Organization.countDocuments({ status: "suspended" }),
    User.countDocuments(),
    User.countDocuments({ status: "active" }),
    User.countDocuments({ status: "pending" }),
    Promise.resolve(5),
  ]);
  
  // Get recent activity
  const recentOrgs = await Organization.find()
    .sort({ created_at: -1 })
    .limit(5)
    .select("name status created_at")
    .lean();
  
  const recentUsers = await User.find()
    .sort({ created_at: -1 })
    .limit(5)
    .select("name email status created_at")
    .lean();
  
  return {
    organizations: {
      total: totalOrganizations,
      active: activeOrganizations,
      suspended: suspendedOrganizations,
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      pending: pendingUsers,
    },
    roles: {
      total: totalRoles,
    },
    recentActivity: {
      organizations: recentOrgs,
      users: recentUsers,
    },
  };
};

/**
 * Suspend an organization
 */
export const suspendOrganization = async (organizationId, suspendedBy, reason = "") => {
  const org = await Organization.findById(organizationId);
  if (!org) throw new Error("Organization not found");
  if (org.status === "suspended") throw new Error("Organization is already suspended");
  
  org.status = "suspended";
  await org.save();
  
  // Disable all users in the organization
  await User.updateMany(
    { organization_id: organizationId },
    { status: "disabled" }
  );
  
  await logAction({
    user_id: suspendedBy,
    organization_id: organizationId,
    action: "organization_suspended",
    table_name: "organizations",
    record_id: organizationId.toString(),
    old_value: { status: org.status },
    new_value: { status: "suspended", reason },
  });
  
  return { message: "Organization suspended successfully" };
};

/**
 * Activate a suspended organization
 */
export const activateOrganization = async (organizationId, activatedBy) => {
  const org = await Organization.findById(organizationId);
  if (!org) throw new Error("Organization not found");
  if (org.status === "active") throw new Error("Organization is already active");
  
  org.status = "active";
  await org.save();
  
  // Re-enable active users in the organization
  await User.updateMany(
    { 
      organization_id: organizationId,
      status: "disabled"
    },
    { status: "active" }
  );
  
  await logAction({
    user_id: activatedBy,
    organization_id: organizationId,
    action: "organization_activated",
    table_name: "organizations",
    record_id: organizationId.toString(),
    old_value: { status: org.status },
    new_value: { status: "active" },
  });
  
  return { message: "Organization activated successfully" };
};

/**
 * Get organization details with full analytics
 */
export const getOrganizationDetails = async (organizationId) => {
  const org = await Organization.findById(organizationId)
    .select("-__v")
    .lean();
  
  if (!org) throw new Error("Organization not found");
  
  const userCount = await User.countDocuments({ organization_id: organizationId });
  const activeUserCount = await User.countDocuments({ 
    organization_id: organizationId, 
    status: "active" 
  });
  
  // We have a static set of 5 system roles now
  const roleCount = 5;
  
  return {
    ...org,
    statistics: {
      users: {
        total: userCount,
        active: activeUserCount,
      },
      roles: {
        total: roleCount,
      },
    },
  };
};

export default {
  isSuperAdmin,
  getSuperAdmins,
  createSuperAdmin,
  getSystemStats,
  suspendOrganization,
  activateOrganization,
  getOrganizationDetails,
};