import bcrypt from "bcrypt";
import User from "../user/user.schema.js";
import Role from "../role/role.schema.js";
import Organization from "../organization/organization.schema.js";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";

const normalizeRole = (user) => {
  const raw = user.role_id?.role_name || user.roleName || user.role_name || "customer";
  const lowered = String(raw).toLowerCase();
  if (lowered === "agent") return "support";
  if (lowered === "user" || lowered === "member") return "customer";
  return lowered;
};

const buildNavigation = (role, orgFeatures, permissions) => {
  const roleNavigation = {
    super_admin: [
      { id: "dashboard", label: "Dashboard", icon: "grid", path: "/admin", visible: true },
      { id: "organizations", label: "Organizations", icon: "building", path: "/admin/organizations", visible: true },
      { id: "users", label: "Users", icon: "users", path: "/admin/users", visible: true },
      { id: "roles", label: "Roles", icon: "shield", path: "/admin/roles", visible: true },
      { id: "documents", label: "Documents", icon: "file", path: "/admin/documents", visible: true },
      { id: "verifications", label: "Verifications", icon: "check-square", path: "/admin/document-verifications", visible: true },
      { id: "analytics", label: "Analytics", icon: "chart", path: "/admin/ai-analytics", visible: orgFeatures.analytics_enabled !== false },
      { id: "knowledge-base", label: "Knowledge Base", icon: "book", path: "/admin/knowledge-base", visible: true },
      { id: "settings", label: "Settings", icon: "gear", path: "/admin/ai-config", visible: true },
    ],
    admin: [
      { id: "dashboard", label: "Dashboard", icon: "grid", path: "/org-admin", visible: true },
      { id: "users", label: "Users", icon: "users", path: "/org-admin/users", visible: true },
      { id: "documents", label: "Documents", icon: "file", path: "/org-admin/documents", visible: true },
      { id: "document-types", label: "Doc Types", icon: "file-check", path: "/org-admin/document-types", visible: true },
      { id: "verifications", label: "Verifications", icon: "check-square", path: "/org-admin/document-verifications", visible: orgFeatures.document_verification_enabled !== false },
      { id: "faq", label: "FAQs", icon: "help-circle", path: "/org-admin/faqs", visible: true },
      { id: "chatbot", label: "Chatbot", icon: "message", path: "/org-admin/chatbot", visible: true },
      { id: "analytics", label: "AI Analytics", icon: "chart", path: "/org-admin/ai-analytics", visible: orgFeatures.analytics_enabled !== false },
      { id: "conversations", label: "Conversations", icon: "message-square", path: "/org-admin/conversations", visible: true },
      { id: "knowledge-base", label: "Knowledge Base", icon: "book", path: "/org-admin/knowledge-base", visible: permissions.can_review_documents },
      { id: "settings", label: "Settings", icon: "gear", path: "/org-admin", visible: true },
    ],
    support: [
      { id: "dashboard", label: "Dashboard", icon: "grid", path: "/support/dashboard", visible: true },
      { id: "tickets", label: "Tickets", icon: "ticket", path: "/support/tickets", visible: true },
      { id: "chat", label: "Live Chat", icon: "message", path: "/support/chat", visible: orgFeatures.chat_enabled !== false },
      { id: "documents", label: "Documents", icon: "file", path: "/support/documents", visible: orgFeatures.document_verification_enabled !== false },
      { id: "notifications", label: "Notifications", icon: "bell", path: "/support/notifications", visible: true },
    ],
    customer: [
      { id: "dashboard", label: "Dashboard", icon: "grid", path: "/dashboard", visible: true },
      { id: "chat", label: "AI Chat", icon: "message", path: "/chat", visible: orgFeatures.chat_enabled !== false },
      { id: "documents", label: "Documents", icon: "file", path: "/documents", visible: true },
      { id: "tickets", label: "Tickets", icon: "ticket", path: "/tickets", visible: orgFeatures.tickets_enabled !== false },
    ],
  };

  return roleNavigation[role] || roleNavigation.customer;
};

const buildPermissions = (role, orgFeatures) => {
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
      can_review_documents: true,
      can_approve_documents: true,
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
      can_review_documents: true,
      can_approve_documents: true,
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
      can_review_documents: true,
      can_approve_documents: true,
    },
    customer: {
      can_upload_documents: true,
      can_verify_documents: false,
      can_manage_users: false,
      can_view_analytics: false,
      can_broadcast_notifications: false,
      can_configure_ai: false,
      can_export_data: false,
      can_bulk_upload: false,
      can_manage_organizations: false,
      can_view_system_config: false,
      can_review_documents: false,
      can_approve_documents: false,
    },
  };

  return rolePermissions[role] || rolePermissions.customer;
};

const generateUIConfig = (user, organization) => {
  const role = normalizeRole(user);
  const orgFeatures = organization?.features || {};
  const orgLimits = organization?.limits || {};
  const orgBranding = organization?.branding || {};
  const permissions = buildPermissions(role, orgFeatures);
  const navigation = buildNavigation(role, orgFeatures, permissions);

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

  const limits = {
    max_file_size_mb: orgLimits.max_file_size_mb || 10,
    allowed_file_types: organization?.allowed_file_types || ["pdf", "docx", "jpg", "jpeg", "png"],
    max_uploads_per_day: orgLimits.max_uploads_per_day || 50,
    max_knowledge_base_docs: orgLimits.max_knowledge_base_docs || 1000,
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
    navigation,
    permissions,
    features,
    limits,
    tenant: {
      organization_id: organization?._id || null,
      organization_slug: organization?.slug || organization?.organization_id || null,
      organization_name: organization?.name || null,
      role,
    },
  };
};

export const register = async (userData) => {
  let { organization_id, role_id, name, email, phone, password, dob } = userData;

  const existingUser = await User.findOne({ email, is_deleted: { $ne: true } });
  if (existingUser) throw new Error("Email already registered");

  if (!role_id) {
    const fallbackRole = await Role.findOne({ role_name: "customer" });
    if (!fallbackRole) throw new Error("Role is required");
    role_id = fallbackRole._id;
  }

  if (!organization_id) {
    const fallbackOrg = await Organization.findOne({ status: "active", is_deleted: { $ne: true } }).sort({ created_at: 1 });
    if (!fallbackOrg) throw new Error("Organization is required");
    organization_id = fallbackOrg._id;
  }

  const role = await Role.findById(role_id);
  const roleName = normalizeRole({ role_id: role, roleName: role?.role_name });
  const isSupportRole = roleName === "support";
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
    ? "User registered successfully. Your account requires approval before you can login."
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
      organizationId: user.organization_id?._id,
      roleId: user.role_id?._id,
      roleName: user.role_id?.role_name,
      email: user.email,
    },
    env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  const ui_config = generateUIConfig(user, user.organization_id);

  return {
    message: "Login successful",
    access_token: token,
    user: {
      _id: user._id,
      id: user._id,
      organization_id: user.organization_id?._id,
      role_id: { _id: user.role_id?._id, role_name: user.role_id?.role_name },
      roleName: user.role_id?.role_name,
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

export { generateUIConfig, normalizeRole };
