import bcrypt from "bcrypt";
import User from "../user/user.schema.js";
import Organization from "../organization/organization.schema.js";
import Branch from "../branch/branch.schema.js";
import env from "../../config/env.js";
import crypto from "crypto";
import { sendEmail } from "../../utils/email.js";
import { REQUESTABLE_ROLE_KEYS, RESTRICTED_ROLE_KEYS, ROLE_KEYS } from "../../utils/constants.js";
import {
  signAccessToken,
  issueRefreshSession,
  revokeRefreshSession,
  revokeAllUserSessions,
  findValidSession,
} from "./token.service.js";

export const register = async (userData) => {
  const { organization_id, role, name, email, phone, password, dob } =
    userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("Email already registered");

  // Validate that the role is not restricted
  if (role) {
    // Validate role against allowed roles
    const validRoles = Object.values(ROLE_KEYS);
    if (!validRoles.includes(role)) {
      throw new Error("Invalid role selected");
    }

    // Check if the role is restricted
    if (RESTRICTED_ROLE_KEYS.some(restricted =>
      role.toLowerCase() === restricted.toLowerCase()
    )) {
      throw new Error("Cannot register with admin or super admin roles");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    organization_id,
    role,
    name,
    email,
    phone,
    password: hashedPassword,
    dob,
    auth_type: "local",
    status: "active",
  });

  return {
    message: "User registered successfully",
    user: {
      id: user._id,
      organization_id: user.organization_id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
    },
  };
};

/**
 * Register a new user with status "pending" — requires admin approval.
 */
export const registerWithApproval = async (userData) => {
  const { organization_id, role, name, email, phone, password, dob } =
    userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    if (existingUser.status === "pending") {
      throw new Error("A registration with this email is already pending approval.");
    }
    throw new Error("Email already registered");
  }

  // Validate that the role is not restricted
  const validRoles = Object.values(ROLE_KEYS);
  if (!validRoles.includes(role)) {
    throw new Error("Invalid role selected");
  }

  if (RESTRICTED_ROLE_KEYS.some(restricted =>
    role.toLowerCase() === restricted.toLowerCase()
  )) {
    throw new Error("Cannot register with admin or super admin roles");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    organization_id,
    role,
    name,
    email,
    phone,
    password: hashedPassword,
    dob,
    auth_type: "local",
    status: "pending",
  });

  return {
    message: "Registration submitted for admin approval",
    user: {
      registrationId: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
    },
  };
};

/**
 * Get all pending registrations — for admin review.
 * Optionally scoped to an organization.
 */
export const getPendingRegistrations = async (organizationId = null) => {
  const filter = { status: "pending" };
  if (organizationId) filter.organization_id = organizationId;

  const users = await User.find(filter)
    .populate("organization_id", "name")
    .select("-password -otp -otp_expiry -fcm_token")
    .sort({ created_at: -1 });

  return users;
};

/**
 * Approve or reject a pending user registration.
 * On approval: sets status to "approved" and records the admin.
 * The caller (route) is responsible for sending the OTP email.
 *
 * When `organizationId` is provided (non-super-admin caller), the target user
 * must belong to that organization — prevents cross-tenant approval.
 */
export const approveRegistration = async (userId, action, adminId, rejectionReason = "", organizationId = null) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.status !== "pending") {
    throw new Error(`Cannot ${action} a registration with status: ${user.status}`);
  }

  if (organizationId && user.organization_id?.toString() !== organizationId.toString()) {
    throw new Error("Cannot manage a registration outside your organization");
  }

  if (action === "approve") {
    user.status = "approved";
    user.approved_by = adminId;
    user.approved_at = new Date();
    user.rejection_reason = null;
  } else if (action === "reject") {
    user.status = "blocked";
    user.approved_by = adminId;
    user.approved_at = new Date();
    user.rejection_reason = rejectionReason || "Registration rejected by administrator";
  } else {
    throw new Error("Invalid action. Use 'approve' or 'reject'.");
  }

  await user.save();
  return user;
};

/**
 * Check the approval status of a user by email.
 */
export const checkUserStatus = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select("status name email approved_at rejection_reason")
    .lean();

  if (!user) throw new Error("No account found with this email");

  return {
    status: user.status,
    name: user.name,
    email: user.email,
    approved_at: user.approved_at,
    rejection_reason: user.rejection_reason,
  };
};

export const login = async ({ email, password, organization_id }, ctx = {}) => {
  const query = { email: email.toLowerCase().trim() };
  if (organization_id) {
    query.organization_id = organization_id;
  }
  console.log("[Login] Query:", JSON.stringify(query));
  const user = await User.findOne(query)
    .populate("organization_id");

  if (!user) {
    console.log({
      emailReceived: email,
      userFound: !!user
    });
    console.log("[Login] User not found for query", query);
    throw new Error("Invalid email, password, or organization");
  }

  console.log({
    emailReceived: email,
    userFound: !!user,
    passwordHashExists: !!user?.password,
    status: user?.status,
    role: user?.role,
    tenantId: user?.organization_id
  });

  // Provide helpful messages for non-active users
  if (user.status === "pending") {
    throw new Error("PENDING_APPROVAL: Your registration is pending admin approval. You will receive an email once approved.");
  }
  if (user.status === "approved") {
    throw new Error("OTP_REQUIRED: Your account has been approved. Please verify your OTP sent to your email before logging in.");
  }
  if (user.status === "blocked") {
    throw new Error("ACCOUNT_REJECTED: Your registration has been rejected. Please contact support for assistance.");
  }
  if (user.status !== "active") {
    console.log(`[Login] User found but status is: ${user.status}`);
    throw new Error("Your account is not active. Please contact support.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log({
    userFound: !!user,
    passwordValid: isPasswordValid
  });
  
  if (!isPasswordValid) {
    console.log(`[Login] Password mismatch for ${email}`);
    throw new Error("Invalid email, password, or organization");
  }

  if (!user.organization_id || !user.role) {
    console.log(`[Login] User has invalid organization or role reference. org=${!!user.organization_id}, role=${user.role}`);
    throw new Error("Invalid email, password, or organization");
  }

  if (user.two_factor_enabled) {
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + (env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);
    user.otp = await bcrypt.hash(otp, 10);
    user.otp_expiry = expiry;
    await user.save();

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;">
        <h2 style="color:#1a1a2e;">Two-Factor Authentication</h2>
        <p>Your one-time verification code is:</p>
        <div style="background:#f0f4ff;border-radius:8px;padding:16px;text-align:center;margin:20px 0;">
          <span style="font-size:32px;font-weight:bold;color:#4f46e5;letter-spacing:8px;">${otp}</span>
        </div>
        <p style="color:#666;font-size:14px;">This code expires in ${env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Your Two-Factor Authentication Code",
      html,
    });

    return {
      twoFactorRequired: true,
      email: user.email,
    };
  }

  const auth = await buildAuthTokens(user, ctx);

  return {
    message: "Login successful",
    token: auth.accessToken,
    refreshToken: auth.refreshToken,
    user: auth.user,
  };
};

export const changePassword = async (email, currentPassword, newPassword) => {
  const user = await User.findOne({ email });
  if (!user || user.status !== "active") {
    throw new Error("Invalid email or current password");
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or current password");
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new Error("New password cannot be the same as the current password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  return { message: "Password changed successfully" };
};

/**
 * Resolve the org + role references for a user doc. Handles both populated
 * (object) and unpopulated (id) references.
 */
const resolveOrgAndRole = async (user) => {
  const org =
    typeof user.organization_id === "object"
      ? user.organization_id
      : await Organization.findById(user.organization_id).lean();
  // Role is now a string, no need to look up in DB
  const role = user.role;
  return { org, role };
};

/**
 * Resolve the branch reference for a user doc. Handles both populated
 * (object) and unpopulated (id) references. Returns null for org-level
 * users (admin / super_admin) who operate across branches.
 */
const resolveBranch = async (user) => {
  const branchId = user.branch_id?._id || user.branch_id || null;
  if (!branchId) return null;
  if (typeof user.branch_id === "object" && user.branch_id.name) {
    return user.branch_id;
  }
  return (await Branch.findById(branchId).lean()) || null;
};

/**
 * Sign a short-lived access token and persist a refresh-token session.
 * Returns the access token, the (one-time) refresh token, and a sanitized
 * user payload the client can persist.
 */
export const buildAuthTokens = async (user, ctx = {}) => {
  const { org, role } = await resolveOrgAndRole(user);
  const branch = await resolveBranch(user);

  const organizationId = org?._id || user.organization_id?._id || user.organization_id;
  const branchId = branch?._id?.toString() || user.branch_id?._id?.toString() || user.branch_id?.toString() || null;
  const roleName = role?.role_name || user.role || "customer";
  // Use roleName as roleId since we're using string-based roles
  const roleId = roleName;

  const accessToken = signAccessToken({
    userId: user._id,
    organizationId,
    branchId,
    roles: [roleName],
    roleId,
    roleName,
    email: user.email,
  });

  const { token: refreshToken } = await issueRefreshSession({
    userId: user._id,
    organizationId,
    userAgent: ctx.userAgent || "",
    ip: ctx.ip || "",
  });

  const orgName = org?.name || user.organization_id?.name;
  const sanitizedUser = {
    id: user._id,
    _id: user._id,
    userId: user._id,
    organization_id:
      typeof user.organization_id === "object"
        ? { _id: organizationId, name: orgName }
        : organizationId,
    branch_id: branch
      ? { _id: branch._id, name: branch.name, code: branch.code || "" }
      : typeof user.branch_id === "string"
      ? user.branch_id
      : null,
    branchId,
    branchName: branch?.name || null,
    role:
      typeof user.role === "object"
        ? { _id: roleId, role_name: roleName }
        : user.role,
    roleName,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    two_factor_enabled: user.two_factor_enabled ?? false,
    profileImage: user.profileImage || null,
  };

  console.log("[buildAuthTokens] sanitizedUser:", JSON.stringify(sanitizedUser, null, 2));

  return { accessToken, refreshToken, user: sanitizedUser };
};

/**
 * Build a JWT + refresh token + sanitized user payload for an existing active
 * user. Used by the OAuth and standard login flows.
 */
export const buildAuthResponse = async (user, ctx = {}) => {
  const auth = await buildAuthTokens(user, ctx);
  return {
    message: "Login successful",
    token: auth.accessToken,
    refreshToken: auth.refreshToken,
    user: auth.user,
  };
};

/**
 * Rotate a refresh token: validate the stored session, sign a fresh access
 * token, revoke the used refresh session and issue a new one.
 */
export const refreshTokens = async (refreshToken, ctx = {}) => {
  if (!refreshToken) throw new Error("Refresh token is required");

  const session = await findValidSession(refreshToken);
  if (!session) throw new Error("Invalid or expired refresh token. Please sign in again.");

  const user = await User.findById(session.user_id)
    .populate("organization_id");

  if (!user) {
    await revokeRefreshSession(refreshToken);
    throw new Error("User not found. Please sign in again.");
  }

  if (user.status !== "active") {
    await revokeRefreshSession(refreshToken);
    throw new Error("Your account is not active.");
  }

  // Rotate: the used refresh token is single-use.
  await revokeRefreshSession(refreshToken);
  const auth = await buildAuthTokens(user, ctx);

  return {
    message: "Token refreshed",
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    user: auth.user,
  };
};

/**
 * Log out. Revokes the given refresh session (single device) when a token is
 * supplied; otherwise revokes every active session for the user.
 */
export const logout = async ({ refreshToken, userId } = {}) => {
  if (refreshToken) {
    await revokeRefreshSession(refreshToken);
  } else if (userId) {
    await revokeAllUserSessions(userId);
  }
  return { message: "Logged out successfully" };
};

/**
 * Resolve an organization by MongoDB _id or the alternate organization_id field.
 */
export const resolveOrganization = async (organization_id) => {
  if (!organization_id) {
    throw new Error("Organization ID is required");
  }

  let org = await Organization.findById(organization_id).lean();
  if (!org) {
    org = await Organization.findOne({ organization_id }).lean();
  }
  if (!org) {
    throw new Error("Organization not found");
  }
  return org;
};

/**
 * Resolve a role that is eligible for self/registration selection.
 * Accepts a role_name string.
 * Rejects restricted roles (super_admin, admin, branch_admin).
 */
export const resolveRequestableRole = async (organizationId, requestedRole) => {
  if (!requestedRole) {
    throw new Error("Role selection is required");
  }

  // Validate role against allowed roles
  const validRoles = Object.values(ROLE_KEYS);
  if (!validRoles.includes(requestedRole)) {
    throw new Error("Selected role not found");
  }

  // Enforce that the role is requestable (not a restricted admin role)
  const normalized = requestedRole.toLowerCase().replace(/[\s_]+/g, "");
  const restricted = RESTRICTED_ROLE_KEYS;
  if (restricted.includes(normalized) || normalized.includes("superadmin")) {
    throw new Error("The selected role cannot be self-assigned");
  }

  return requestedRole;
};