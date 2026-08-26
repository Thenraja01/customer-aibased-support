import User from "../user/user.schema.js";
import RegistrationRequest from "../registration-request/registrationRequest.schema.js";
import { logAction } from "../audit-log/auditLog.service.js";
import { createNotification } from "../notification/notification.service.js";
import { sendEmail } from "../../utils/email.js";
import { invalidateUserCache } from "../../middleware/auth.middleware.js";

const audit = (data) => logAction(data).catch(() => {});

const sendDecisionEmail = async (user, orgName, approved, reason = "") => {
  await sendEmail({
    to: user.email,
    subject: approved ? "Your registration was approved" : "Your registration was rejected",
    html: approved
      ? `<p>Hi ${user.name},</p><p>Your registration with <b>${orgName}</b> has been approved. You can now log in.</p>`
      : `<p>Hi ${user.name},</p><p>Your registration with <b>${orgName}</b> was rejected${reason ? `: ${reason}` : ""}.</p>`,
    organizationId: user.organization_id,
    branchId: user.branch_id,
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
    result.availableRoles = [
      { _id: "support", role_name: "support", description: "Support Agent" },
      { _id: "customer", role_name: "customer", description: "Customer" },
    ];
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

  const finalRole = String(roleId || registration.requested_role_id || "customer").toLowerCase().trim();
  const ALLOWED_ROLES = ["super_admin", "admin", "branch_admin", "support", "customer"];
  if (!ALLOWED_ROLES.includes(finalRole)) {
    throw new Error(`Invalid role: ${finalRole}`);
  }

  // Update user's role
  user.role = finalRole;
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

  await invalidateUserCache(user._id.toString());

  await createNotification({
    user_id: user._id,
    organization_id: registration.organization_id,
    title: "Registration approved",
    message: `Your account has been approved with the ${finalRole} role. You can now log in.`,
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
    new_value: { status: "approved", user_status: "active", assigned_role: finalRole },
  });

  return { message: "User approved and activated", data: { userId: user._id, status: user.status, roleName: finalRole } };
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
