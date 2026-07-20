import bcrypt from "bcrypt";
import User from "../user/user.schema.js";
import Role from "../role/role.schema.js";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";

/**
 * Generate UI configuration based on user role and organization settings
 * This drives the entire frontend UI - navigation, permissions, features, branding
 */
const generateUIConfig = (user, organization) => {
  const role = user.role_id?.role_name || "customer";
  const orgFeatures = organization?.features || {};
  const orgLimits = organization?.limits || {};
  const orgBranding = organization?.branding || {};

  // Role-based permissions map
  const rolePermissions = {
    super_admin: {
      can_upload_documents: true,
      can_verify_documents: true,
      can_manage_users: true,
      can_view_analytics: true,
      can_broadcast_notifications: true,
      can_configure_ai: true,
      can_export_data: true,
      can_bulk_upload: true,
      can_manage_organizations: true,
      can_view_system_config: true,
    },
    admin: {
      can_upload_documents: true,
      can_verify_documents: true,
      can_manage_users: true,
      can_view_analytics: true,
      can_broadcast_notifications: true,
      can_configure_ai: true,
      can_export_data: true,
      can_bulk_upload: orgFeatures.bulk_upload_enabled || false,
      can_manage_organizations: false,
      can_view_system_config: false,
    },
    support: {
      can_upload_documents: false,
      can_verify_documents: true,
      can_manage_users: false,
      can_view_analytics: true,
      can_broadcast_notifications: false,
      can_configure_ai: false,
      can_export_data: false,
      can_bulk_upload: false,
      can_manage_organizations: false,
      can_view_system_config: false,
    },
    customer: {
      can_upload_documents: false,
      can_verify_documents: false,
      can_manage_users: false,
      can_view_analytics: false,
      can_broadcast_notifications: false,
      can_configure_ai: false,
      can_export_data: false,
      can_bulk_upload: false,
      can_manage_organizations: false,
      can_view_system_config: false,
    },
  };

  const permissions = rolePermissions[role] || rolePermissions.customer;

  // Navigation items based on role and org features
  const navigation = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "grid",
      path: "/dashboard",
      visible: true,
    },
    {
      id: "chat",
      label: "AI Chat",
      icon: "message",
      path: "/chat",
      visible: orgFeatures.chat_enabled !== false,
    },
    {
      id: "documents",
      label: "Documents",
      icon: "file",
      path: "/documents",
      visible: true,
    },
    {
      id: "tickets",
      label: "Tickets",
      icon: "ticket",
      path: "/tickets",
      visible: orgFeatures.tickets_enabled !== false,
    },
    {
      id: "knowledge-base",
      label: "Knowledge Base",
      icon: "book",
      path: "/knowledge-base",
      visible: orgFeatures.knowledge_base_enabled === true && (role === "admin" || role === "super_admin"),
    },
    {
      id: "users",
      label: "Users",
      icon: "users",
      path: "/users",
      visible: role === "admin" || role === "super_admin",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: "chart",
      path: "/analytics",
      visible: orgFeatures.analytics_enabled === true && (role === "admin" || role === "support" || role === "super_admin"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: "gear",
      path: "/settings",
      visible: role === "admin" || role === "super_admin",
    },
  ];

  // Feature flags
  const features = {
    rag_enabled: orgFeatures.rag_enabled !== false,
    chat_enabled: orgFeatures.chat_enabled !== false,
    tickets_enabled: orgFeatures.tickets_enabled !== false,
    knowledge_base_enabled: orgFeatures.knowledge_base_enabled === true,
    document_verification_enabled: orgFeatures.document_verification_enabled !== false,
    analytics_enabled: orgFeatures.analytics_enabled === true,
    bulk_upload_enabled: orgFeatures.bulk_upload_enabled === true,
    api_access_enabled: orgFeatures.api_access_enabled === true,
    sso_enabled: orgFeatures.sso_enabled === true,
    two_factor_required: orgFeatures.two_factor_required === true,
  };

  // Limits
  const limits = {
    max_file_size_mb: orgLimits.max_file_size_mb || 10,
    allowed_file_types: organization?.allowed_file_types || ["pdf", "docx", "jpg", "jpeg", "png"],
    max_uploads_per_day: orgLimits.max_uploads_per_day || 50,
  };

  return {
    branding: {
      app_name: orgBranding.app_name || "AI Support Portal",
      primary_color: orgBranding.primary_color || "#2563EB",
      secondary_color: orgBranding.secondary_color || "#7C3AED",
      logo_url: orgBranding.logo_url || "",
      favicon_url: orgBranding.favicon_url || "",
      font_family: orgBranding.font_family || "Inter",
    },
    navigation: navigation.filter((item) => item.visible),
    permissions,
    features,
    limits,
  };
};

export const register = async (userData) => {
  const { organization_id, role_id, name, email, phone, password, dob } =
    userData;

  const existingUser = await User.findOne({ email, is_deleted: { $ne: true } });
  if (existingUser) throw new Error("Email already registered");

  const role = await Role.findById(role_id);
  const isSupportRole = role?.role_name === "support";
  const userStatus = isSupportRole ? "pending" : "active";

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
    status: userStatus,
  });

  const message = isSupportRole
    ? "User registered successfully. Your account requires approval by an admin before you can login."
    : "User registered successfully";

  return {
    message,
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

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email, is_deleted: { $ne: true } })
    .populate("organization_id")
    .populate("role_id");

  if (!user || user.status !== "active") {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  user.last_login = new Date();
  user.login_count = (user.login_count || 0) + 1;
  user.last_active_at = new Date();
  await user.save();

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

  // Generate UI configuration based on user role and organization settings
  const ui_config = generateUIConfig(user, user.organization_id);

  return {
    message: "Login successful",
    access_token: token,
    user: {
      _id: user._id,
      id: user._id,
      organization_id: user.organization_id._id,
      role_id: { _id: user.role_id._id, role_name: user.role_id.role_name },
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      avatar_url: user.avatar_url || "",
    },
    ui_config,
  };
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
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

export { generateUIConfig };
