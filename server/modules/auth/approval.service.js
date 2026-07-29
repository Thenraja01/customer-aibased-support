import User from "../user/user.schema.js";
import RegistrationRequest from "../registration-request/registrationRequest.schema.js";
import { logAction } from "../audit-log/auditLog.service.js";
import { createNotification } from "../notification/notification.service.js";
import { sendEmail } from "../../utils/email.js";
import { assignRole, invalidatePermissionCache } from "../user-role/userRole.service.js";
import { invalidateUserCache } from "../../middleware/auth.middleware.js";

const audit = (data) => logAction(data).catch(() => {});

const sendDecisionEmail = async (user, orgName, approved, reason = "") => {
  await sendEmail({
    to: user.email,
    subject: approved ? "Your registration was approved" : "Your registration was rejected",
    html: approved
      ? `<p>Hi ${user.name},</p><p>Your registration with <b>${orgName}</b> has been approved. You can now log in.</p>`
      : `<p>Hi ${user.name},</p><p>Your registration with <b>${orgName}</b> was rejected${reason ? `: ${reason}` : ""}.</p>`,
  }).catch((err) => console.error("[Approval] Email failed:", err.message));
};

/**
 * Pending registrations visible to an organization's admins.
 * Optionally includes available roles for assignment.
 */
export const getPendingRegistrations = async (organizationId, includeRoles = false) => {
  const filter = { status: "pending" };
  if (organizationId) filter.organization_id = organizationId;

  const requests = await RegistrationRequest.find(filter)
    .populate("requested_role_id", "role_name")
    .populate("organization_id", "name")
    .sort({ created_at: -1 });

  const result = {
    requests: requests.map((r) => ({
      _id: r._id,
      userId: r.user_id,
      organization_id: r.organization_id,
      name: r.name,
      email: r.email,
      provider: r.provider,
      requestedRole: r.requested_role_id?.role_name || null,
      requestedRoleId: r.requested_role_id?._id || null,
      status: r.status,
    rejection_reason: r.rejection_reason,
      created_at: r.created_at,
    })),
    availableRoles: []
  };

  // Include available roles if requested. Super Admin / wildcard roles are
  // never offered for assignment.
  if (includeRoles && organizationId) {
    const Role = (await import("../role/role.schema.js")).default;
    const roles = await Role.find({
      $or: [
        { organization_id: organizationId },
        { organization_id: null }
      ],
      status: "active",
      permissions: { $ne: "*" },
      role_name: { $nin: [/^super[\s_]?admin$/i] },
    }).select("_id role_name description isSystemRole").sort({ role_name: 1 });

    result.availableRoles = roles.map(r => ({
      _id: r._id,
      role_name: r.role_name,
      description: r.description,
      isSystemRole: r.isSystemRole
    }));
  }

  return result;
};

/**
 * Approve a pending registration. Assigns the requested role (or an admin
 * provided alternative) via UserRoles, activates the account, and notifies
 * the user. The admin can choose any available role, not just the requested one.
 */
export const approveRegistration = async (requestId, adminId, { roleId = null } = {}) => {
  const registration = await RegistrationRequest.findById(requestId);
  if (!registration) throw new Error("Registration request not found");
  if (registration.status !== "pending") {
    throw new Error(`Cannot approve a request with status: ${registration.status}`);
  }

  const user = await User.findById(registration.user_id);
  if (!user) throw new Error("User not found");
  if (user.status === "active") throw new Error("User is already active");

  // Use provided role or fall back to requested role
  const finalRoleId = roleId || registration.requested_role_id;
  if (!finalRoleId) throw new Error("No role to assign — specify a role_id");

  // Verify the role exists and belongs to the organization
  const Role = (await import("../role/role.schema.js")).default;
  const role = await Role.findById(finalRoleId);
  if (!role) throw new Error("Selected role not found");
  if (role.organization_id && role.organization_id.toString() !== registration.organization_id.toString()) {
    throw new Error("Selected role does not belong to this organization");
  }
  // Never allow approving a registration into a super-admin (wildcard) role.
  if (Array.isArray(role.permissions) && role.permissions.includes("*")) {
    throw new Error("Cannot assign super admin role");
  }

  // Assign the role in the request's organization.
  await assignRole({
    userId: user._id,
    roleId: finalRoleId,
    organizationId: registration.organization_id,
    assignedBy: adminId,
  });

  // Update user's role_id for quick access
  user.role_id = finalRoleId;
  user.status = "active";
  user.email_verified = true;
  user.email_verified_at = new Date();
  user.approved_by = adminId;
  user.approved_at = new Date();
  user.rejection_reason = null;
  await user.save();

  registration.status = "approved";
  registration.approved_by = adminId;
  registration.approved_at = new Date();
  registration.rejection_reason = null;
  await registration.save();

  await Promise.all([
    invalidateUserCache(user._id.toString()),
    invalidatePermissionCache(user._id.toString(), registration.organization_id.toString()),
  ]);

  await createNotification({
    user_id: user._id,
    organization_id: registration.organization_id,
    title: "Registration approved",
    message: `Your account has been approved with the ${role.role_name} role. You can now log in.`,
    type: "success",
    link: "/login",
  });

  await sendDecisionEmail(user, registration.organization_id?.name || "your organization", true);
  await audit({
    user_id: adminId,
    organization_id: registration.organization_id,
    action: "registration_approved",
    table_name: "registration_requests",
    record_id: registration._id.toString(),
    old_value: { status: "pending" },
    new_value: { status: "approved", user_status: "active", assigned_role: role.role_name },
  });

  return { message: "User approved and activated", data: { userId: user._id, status: user.status, roleName: role.role_name } };
};

/**
 * Reject a pending registration with an optional reason.
 */
export const rejectRegistration = async (requestId, adminId, { reason = "" } = {}) => {
  const registration = await RegistrationRequest.findById(requestId);
  if (!registration) throw new Error("Registration request not found");
  if (registration.status !== "pending") {
    throw new Error(`Cannot reject a request with status: ${registration.status}`);
  }

  const user = await User.findById(registration.user_id);
  if (!user) throw new Error("User not found");

  const rejectionReason = reason.trim() || "Registration rejected by administrator";

  user.status = "rejected";
  user.rejection_reason = rejectionReason;
  user.approved_by = adminId;
  user.approved_at = new Date();
  await user.save();

  registration.status = "rejected";
  registration.rejection_reason = rejectionReason;
  registration.approved_by = adminId;
  registration.approved_at = new Date();
  await registration.save();

  await invalidateUserCache(user._id.toString());

  await createNotification({
    user_id: user._id,
    organization_id: registration.organization_id,
    title: "Registration rejected",
    message: rejectionReason,
    type: "error",
    link: "/login",
  });

  await sendDecisionEmail(user, registration.organization_id?.name || "your organization", false, rejectionReason);
  await audit({
    user_id: adminId,
    organization_id: registration.organization_id,
    action: "registration_rejected",
    table_name: "registration_requests",
    record_id: registration._id.toString(),
    old_value: { status: "pending" },
    new_value: { status: "rejected", reason: rejectionReason },
  });

  return { message: "Registration rejected", data: { userId: user._id, status: user.status } };
};

/**
 * Public status check used by the "registration pending" screen.
 */
export const checkUserStatus = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select("status name email approved_at rejection_reason email_verified")
    .lean();
  if (!user) throw new Error("No account found with this email");

  return {
    status: user.status,
    name: user.name,
    email: user.email,
    email_verified: user.email_verified,
    approved_at: user.approved_at,
    rejection_reason: user.rejection_reason,
  };
};

export default {
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  checkUserStatus,
};
