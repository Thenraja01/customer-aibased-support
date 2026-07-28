import bcrypt from "bcrypt";
import User from "../user/user.schema.js";
import Role from "../role/role.schema.js";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";

// Roles that cannot be assigned during self-registration
const RESTRICTED_ROLES = ["tenant admin", "super admin"];

export const register = async (userData) => {
  const { organization_id, role_id, name, email, phone, password, dob } =
    userData;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("Email already registered");

  // Validate that the role is not restricted
  if (role_id) {
    const role = await Role.findById(role_id);

    if (!role) {
      throw new Error("Invalid role selected");
    }

    // Check if the role is restricted
    if (RESTRICTED_ROLES.some(restricted =>
      role.role_name.toLowerCase() === restricted.toLowerCase()
    )) {
      throw new Error("Cannot register with admin or super admin roles");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    organization_id,
    role_id,
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
      role_id: user.role_id,
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
  const { organization_id, role_id, name, email, phone, password, dob } =
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
  const role = await Role.findById(role_id);
  if (!role) throw new Error("Invalid role selected");

  if (RESTRICTED_ROLES.some(restricted =>
    role.role_name.toLowerCase() === restricted.toLowerCase()
  )) {
    throw new Error("Cannot register with admin or super admin roles");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    organization_id,
    role_id,
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
    .populate("role_id", "role_name description")
    .select("-password -otp -otp_expiry -fcm_token")
    .sort({ created_at: -1 });

  return users;
};

/**
 * Approve or reject a pending user registration.
 * On approval: sets status to "approved" and records the admin.
 * The caller (route) is responsible for sending the OTP email.
 */
export const approveRegistration = async (userId, action, adminId, rejectionReason = "") => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.status !== "pending") {
    throw new Error(`Cannot ${action} a registration with status: ${user.status}`);
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

export const login = async ({ email, password, organization_id }) => {
  const query = { email };
  if (organization_id) {
    query.organization_id = organization_id;
  }
  console.log("[Login] Query:", JSON.stringify(query));
  const user = await User.findOne(query)
    .populate("organization_id")
    .populate("role_id");

  if (!user) {
    console.log("[Login] User not found for query");
    throw new Error("Invalid email, password, or organization");
  }

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
  if (!isPasswordValid) {
    throw new Error("Invalid email, password, or organization");
  }

  if (!user.organization_id || !user.role_id) {
    console.log("[Login] User has invalid organization or role reference");
    throw new Error("Invalid email, password, or organization");
  }

  const token = jwt.sign(
    {
      userId: user._id,
      organizationId: user.organization_id._id,
      roleId: user.role_id._id,
      roleName: user.role_id.role_name,
      email: user.email,
    },
    env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    message: "Login successful",
    token,
    user: {
      id: user._id,
      organization_id: user.organization_id,
      role_id: user.role_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
    },
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