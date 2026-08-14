import mongoose from "mongoose";
import { normalizeRoleName } from "../../utils/constants.js";

// Helper to get Models
const getModels = () => {
  return {
    Organization: mongoose.model("Organization"),
    Branch: mongoose.model("Branch"),
    User: mongoose.model("User"),
    Ticket: mongoose.model("Ticket"),
    Document: mongoose.model("Document"),
    DocumentChunk: mongoose.model("DocumentChunk"),
    Notification: mongoose.model("Notification"),
    Faq: mongoose.model("Faq"),
    AuditLog: mongoose.model("AuditLog"),
    GlobalSetting: mongoose.model("GlobalSetting"),
    Role: mongoose.model("Role"),
    Chat: mongoose.model("Chat"),
  };
};

/**
 * Organization scope for a role.
 *   super_admin → global (application) scope — no org filter
 *   admin       → organization scope
 *   branch_admin/support → organization + branch scope (branch filter is added separately)
 */
export const resolveOrgQuery = (auth) => {
  if (auth.role === "super_admin") return {};
  return { organization_id: auth.organizationId };
};

/**
 * Checks if the user is authorized for the given branch scope.
 * super_admin and admin bypass branch checks entirely.
 * branch_admin and support are limited to their allowed branches.
 */
const checkBranchAccess = (auth, branchId) => {
  if (!branchId) return true;
  if (auth.role === "super_admin" || auth.role === "admin") return true;
  return auth.branchIds.includes(branchId.toString());
};

/**
 * Resolves a branch name or branchId string to a valid Mongoose ObjectId.
 * If the string is a valid ObjectId, returns it. Otherwise, searches for a branch with that name.
 * super_admin resolves globally; other roles only within their own organization.
 */
const resolveBranchId = async (auth, branchIdOrName) => {
  if (!branchIdOrName) return null;
  const { Branch } = getModels();

  if (mongoose.Types.ObjectId.isValid(branchIdOrName)) {
    return branchIdOrName.toString();
  }

  // Search by branch name (case-insensitive)
  const query = {
    name: new RegExp(branchIdOrName, "i"),
    ...(auth.role === "super_admin" ? {} : { organization_id: auth.organizationId }),
  };
  const branch = await Branch.findOne(query).lean();

  if (branch) {
    return branch._id.toString();
  }

  return null;
};

// ── READ TOOLS ──────────────────────────────────────────────────────────

export const getOrganizationDetails = async (auth) => {
  const { Organization } = getModels();

  // Super admin without an organization gets an overview of all organizations
  if (auth.role === "super_admin" && !auth.organizationId) {
    const orgs = await Organization.find()
      .select("_id name email address phone status created_at")
      .limit(50)
      .lean();
    return { success: true, data: { count: orgs.length, items: orgs } };
  }

  const org = await Organization.findById(auth.organizationId)
    .select("_id name email address phone brand_colors created_at")
    .lean();
  return { success: true, data: org };
};

export const getBranches = async (auth) => {
  const { Branch } = getModels();
  const query = resolveOrgQuery(auth);

  if (auth.role === "branch_admin" || auth.role === "support") {
    query._id = { $in: auth.branchIds };
  }

  const branches = await Branch.find(query)
    .select("_id name code address phone status organization_id")
    .limit(100)
    .lean();
  return { success: true, data: { count: branches.length, items: branches } };
};

export const getUsers = async (auth, filters = {}) => {
  const { User } = getModels();
  const query = resolveOrgQuery(auth);

  if (auth.role === "branch_admin" || auth.role === "support") {
    query.branch_id = { $in: auth.branchIds };
  } else if (filters.branchId) {
    const resolved = await resolveBranchId(auth, filters.branchId);
    if (!resolved) return { success: true, data: { count: 0, items: [] } };
    query.branch_id = resolved;
  }

  if (filters.organizationId) {
    query.organization_id = filters.organizationId;
  }
  if (filters.role) {
    query.role = filters.role;
  }
  if (filters.status) {
    query.status = filters.status;
  }

  const users = await User.find(query)
    .select("_id name email phone role status branch_id created_at")
    .limit(100)
    .lean();
  return { success: true, data: { count: users.length, items: users } };
};

export const getUserDetails = async (auth, userId) => {
  const { User } = getModels();
  const scope = resolveOrgQuery(auth);
  const user = await User.findOne({ _id: userId, ...scope })
    .select("_id name email phone role status branch_id created_at")
    .lean();

  if (!user) {
    return { success: false, error: { code: "NOT_FOUND", message: "User not found" } };
  }

  if (!checkBranchAccess(auth, user.branch_id)) {
    return { success: false, error: { code: "FORBIDDEN", message: "Access to user in other branch is restricted" } };
  }

  return { success: true, data: user };
};

export const getTickets = async (auth, filters = {}) => {
  const { Ticket } = getModels();
  const query = resolveOrgQuery(auth);

  if (auth.role === "branch_admin" || auth.role === "support") {
    query.branch_id = { $in: auth.branchIds };
  } else if (filters.branchId) {
    const resolved = await resolveBranchId(auth, filters.branchId);
    if (!resolved) return { success: true, data: { count: 0, items: [] } };
    query.branch_id = resolved;
  }

  if (filters.organizationId) {
    query.organization_id = filters.organizationId;
  }

  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.priority) {
    query.priority = filters.priority;
  }

  const count = await Ticket.countDocuments(query);
  const tickets = await Ticket.find(query)
    .select("_id subject status priority category branch_id created_at")
    .sort({ created_at: -1 })
    .limit(30)
    .lean();

  return { success: true, data: { count, items: tickets } };
};

export const getTicketDetails = async (auth, ticketId) => {
  const { Ticket } = getModels();
  const scope = resolveOrgQuery(auth);
  const ticket = await Ticket.findOne({ _id: ticketId, ...scope })
    .select("_id subject description status priority category branch_id user_id assigned_to created_at")
    .lean();

  if (!ticket) {
    return { success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } };
  }

  if (!checkBranchAccess(auth, ticket.branch_id)) {
    return { success: false, error: { code: "FORBIDDEN", message: "Access to ticket in other branch is restricted" } };
  }

  return { success: true, data: ticket };
};

export const getDocuments = async (auth, filters = {}) => {
  const { Document } = getModels();
  const query = resolveOrgQuery(auth);

  if (auth.role === "branch_admin" || auth.role === "support") {
    query.branch_id = { $in: auth.branchIds };
  } else if (filters.branchId) {
    const resolved = await resolveBranchId(auth, filters.branchId);
    if (!resolved) return { success: true, data: { count: 0, items: [] } };
    query.branch_id = resolved;
  }

  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.visiblity) {
    query.visibility = filters.visiblity;
  }
  if (filters.organizationId) {
    query.organization_id = filters.organizationId;
  }

  const count = await Document.countDocuments(query);
  const docs = await Document.find(query)
    .select("_id title file_name file_size status visibility branch_id created_at")
    .limit(50)
    .lean();

  return { success: true, data: { count, items: docs } };
};

export const getDocumentStatus = async (auth, docId) => {
  const { Document } = getModels();
  const scope = resolveOrgQuery(auth);
  const doc = await Document.findOne({ _id: docId, ...scope })
    .select("_id title status visibility branch_id file_name file_size")
    .lean();

  if (!doc) {
    return { success: false, error: { code: "NOT_FOUND", message: "Document not found" } };
  }

  if (!checkBranchAccess(auth, doc.branch_id)) {
    return { success: false, error: { code: "FORBIDDEN", message: "Access to document in other branch is restricted" } };
  }

  return { success: true, data: doc };
};

export const getNotifications = async (auth, filters = {}) => {
  const { Notification } = getModels();
  const query = resolveOrgQuery(auth);

  if (auth.role === "branch_admin" || auth.role === "support") {
    query.branch_id = { $in: auth.branchIds };
  } else if (filters.branchId) {
    const resolved = await resolveBranchId(auth, filters.branchId);
    if (!resolved) return { success: true, data: { count: 0, items: [] } };
    query.branch_id = resolved;
  }

  if (filters.organizationId) {
    query.organization_id = filters.organizationId;
  }

  const count = await Notification.countDocuments(query);
  const notifications = await Notification.find(query)
    .select("_id title message type is_read branch_id created_at")
    .sort({ created_at: -1 })
    .limit(50)
    .lean();

  return { success: true, data: { count, items: notifications } };
};

export const getFAQs = async (auth, filters = {}) => {
  const { Faq } = getModels();
  const query = resolveOrgQuery(auth);

  if (filters.category) {
    query.category = filters.category;
  }
  if (typeof filters.isActive === "boolean") {
    query.is_active = filters.isActive;
  }

  const count = await Faq.countDocuments(query);
  const faqs = await Faq.find(query)
    .select("_id question answer category is_active status created_at")
    .limit(50)
    .lean();

  return { success: true, data: { count, items: faqs } };
};

export const getReports = async (auth) => {
  const { Ticket, User, Document } = getModels();
  const orgQuery = resolveOrgQuery(auth);

  if (auth.role === "branch_admin" || auth.role === "support") {
    orgQuery.branch_id = { $in: auth.branchIds };
  }

  const [totalTickets, openTickets, totalUsers, pendingDocs] = await Promise.all([
    Ticket.countDocuments(orgQuery),
    Ticket.countDocuments({ ...orgQuery, status: "open" }),
    User.countDocuments(orgQuery),
    Document.countDocuments({ ...orgQuery, status: "pending" }),
  ]);

  return {
    success: true,
    data: {
      totalTickets,
      openTickets,
      totalUsers,
      pendingDocs
    }
  };
};

export const getPendingItems = async (auth) => {
  const { Ticket, Document } = getModels();
  const orgQuery = resolveOrgQuery(auth);

  if (auth.role === "branch_admin" || auth.role === "support") {
    orgQuery.branch_id = { $in: auth.branchIds };
  }

  const [pendingTickets, pendingDocs] = await Promise.all([
    Ticket.find({ ...orgQuery, status: { $in: ["open", "assigned", "in_progress"] } })
      .select("_id subject status priority branch_id created_at")
      .limit(10)
      .lean(),
    Document.find({ ...orgQuery, status: "pending" })
      .select("_id title status branch_id file_name")
      .limit(10)
      .lean()
  ]);

  return {
    success: true,
    data: {
      pendingTickets: { count: pendingTickets.length, items: pendingTickets },
      pendingDocs: { count: pendingDocs.length, items: pendingDocs }
    }
  };
};

// ── SUPER ADMIN (APPLICATION LEVEL) READ TOOLS ────────────────────────────

export const getOrganizations = async (auth, filters = {}) => {
  if (auth.role !== "super_admin") {
    return { success: false, error: { code: "FORBIDDEN", message: "Only super admins can access platform-wide organizations" } };
  }

  const { Organization } = getModels();
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.search) query.name = new RegExp(filters.search, "i");

  const [count, items] = await Promise.all([
    Organization.countDocuments(query),
    Organization.find(query)
      .select("_id name email code address phone status domain created_at")
      .sort({ created_at: -1 })
      .limit(50)
      .lean(),
  ]);

  return { success: true, data: { count, items } };
};

export const getPlatformStats = async (auth) => {
  if (auth.role !== "super_admin") {
    return { success: false, error: { code: "FORBIDDEN", message: "Only super admins can view platform stats" } };
  }

  const { Organization, Branch, User, Ticket, Document, Chat, AuditLog } = getModels();
  const [organizations, activeOrganizations, branches, users, tickets, openTickets, pendingDocs, chats, auditLogs] = await Promise.all([
    Organization.countDocuments(),
    Organization.countDocuments({ status: "active" }),
    Branch.countDocuments(),
    User.countDocuments(),
    Ticket.countDocuments(),
    Ticket.countDocuments({ status: { $in: ["open", "assigned", "in_progress"] } }),
    Document.countDocuments({ status: "pending" }),
    Chat.countDocuments(),
    AuditLog.countDocuments(),
  ]);

  return {
    success: true,
    data: {
      organizations: { total: organizations, active: activeOrganizations },
      branches,
      users,
      tickets: { total: tickets, pending: openTickets },
      documents: { pending: pendingDocs },
      chats,
      auditLogs,
    },
  };
};

export const getAuditLogs = async (auth, filters = {}) => {
  if (auth.role !== "super_admin") {
    return { success: false, error: { code: "FORBIDDEN", message: "Only super admins can view platform audit logs" } };
  }

  const { AuditLog } = getModels();
  const query = {};
  if (filters.organizationId) query.organization_id = filters.organizationId;
  if (filters.action) query.action = new RegExp(filters.action, "i");

  const [count, items] = await Promise.all([
    AuditLog.countDocuments(query),
    AuditLog.find(query)
      .select("_id user_id action table_name record_id organization_id branch_id created_at")
      .sort({ created_at: -1 })
      .limit(50)
      .lean(),
  ]);

  return { success: true, data: { count, items } };
};

// ── ACTION TOOLS (Requires confirmation/permission checks) ──────────────────

export const sendNotification = async (auth, { organizationId, branchId, title, message, type = "info" }) => {
  const { User, Notification } = getModels();

  // Super admin and admin may target any branch/org; branch_scoped roles are limited to their own branch
  const targetOrg = (auth.role === "super_admin" && organizationId) ? organizationId : auth.organizationId;

  const resolvedBranch = await resolveBranchId(auth, branchId);
  if (branchId && !resolvedBranch) {
    return { success: false, error: { code: "NOT_FOUND", message: `Branch "${branchId}" not found.` } };
  }

  if (auth.role !== "admin" && auth.role !== "super_admin" && (!resolvedBranch || !auth.branchIds.includes(resolvedBranch))) {
    return { success: false, error: { code: "FORBIDDEN", message: "You can only notify your own branch users" } };
  }

  const query = {
    ...(targetOrg ? { organization_id: targetOrg } : {}),
    status: "active",
  };
  if (resolvedBranch) {
    query.branch_id = resolvedBranch;
  }

  const users = await User.find(query).select("_id").lean();
  if (users.length === 0) {
    return { success: true, data: { count: 0, message: "No active users found to notify." } };
  }

  const notifications = users.map(u => ({
    user_id: u._id,
    organization_id: targetOrg || null,
    branch_id: resolvedBranch || null,
    title,
    message,
    type,
    is_read: false
  }));

  await Notification.insertMany(notifications);
  return { success: true, data: { count: users.length, message: `Dispatched ${users.length} notifications.` } };
};

export const createTicket = async (auth, { organizationId, userId, subject, description, priority = "medium", category = "other", branchId }) => {
  const { Ticket } = getModels();

  const targetOrg = (auth.role === "super_admin" && organizationId) ? organizationId : auth.organizationId;

  const resolvedBranch = await resolveBranchId(auth, branchId) || (auth.role === "super_admin" ? null : auth.branchIds[0]);
  if (!checkBranchAccess(auth, resolvedBranch)) {
    return { success: false, error: { code: "FORBIDDEN", message: "Cannot create ticket for other branch" } };
  }

  const newTicket = await Ticket.create({
    user_id: userId || auth.userId,
    organization_id: targetOrg || null,
    branch_id: resolvedBranch,
    subject,
    description,
    priority,
    category,
    status: "open"
  });

  return { success: true, data: newTicket };
};

export const updateTicket = async (auth, { ticketId, updates = {} }) => {
  const { Ticket } = getModels();
  const ticket = await Ticket.findOne({ _id: ticketId, ...resolveOrgQuery(auth) });

  if (!ticket) {
    return { success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } };
  }

  if (!checkBranchAccess(auth, ticket.branch_id)) {
    return { success: false, error: { code: "FORBIDDEN", message: "Cannot update tickets in other branches" } };
  }

  const allowedUpdates = ["status", "priority", "category", "subject", "description"];
  allowedUpdates.forEach(key => {
    if (updates[key] !== undefined) {
      ticket[key] = updates[key];
    }
  });

  await ticket.save();
  return { success: true, data: ticket };
};

export const assignTicket = async (auth, { ticketId, assignedToId }) => {
  const { Ticket, User } = getModels();
  const ticket = await Ticket.findOne({ _id: ticketId, ...resolveOrgQuery(auth) });

  if (!ticket) {
    return { success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } };
  }

  if (!checkBranchAccess(auth, ticket.branch_id)) {
    return { success: false, error: { code: "FORBIDDEN", message: "Cannot assign tickets in other branches" } };
  }

  const agent = await User.findOne({ _id: assignedToId, ...resolveOrgQuery(auth) });
  if (!agent) {
    return { success: false, error: { code: "NOT_FOUND", message: "Agent not found" } };
  }

  ticket.assigned_to = assignedToId;
  ticket.status = "assigned";
  await ticket.save();
  return { success: true, data: ticket };
};

export const updateDocumentStatus = async (auth, { docId, status }) => {
  const { Document } = getModels();
  const doc = await Document.findOne({ _id: docId, ...resolveOrgQuery(auth) });

  if (!doc) {
    return { success: false, error: { code: "NOT_FOUND", message: "Document not found" } };
  }

  if (!checkBranchAccess(auth, doc.branch_id)) {
    return { success: false, error: { code: "FORBIDDEN", message: "Cannot update document status in other branch" } };
  }

  doc.status = status;
  await doc.save();
  return { success: true, data: doc };
};

export const createFAQ = async (auth, { organizationId, question, answer, category = "general", is_active = true }) => {
  const { Faq } = getModels();
  if (auth.role !== "admin" && auth.role !== "super_admin") {
    return { success: false, error: { code: "FORBIDDEN", message: "Only organization admins can manage FAQs" } };
  }

  const targetOrg = (auth.role === "super_admin" && organizationId) ? organizationId : auth.organizationId;

  const faq = await Faq.create({
    organization_id: targetOrg || null,
    question,
    answer,
    category,
    is_active,
    status: "approved",
    created_by: auth.userId
  });

  return { success: true, data: faq };
};

export const updateFAQ = async (auth, { faqId, updates = {} }) => {
  const { Faq } = getModels();
  if (auth.role !== "admin" && auth.role !== "super_admin") {
    return { success: false, error: { code: "FORBIDDEN", message: "Only organization admins can manage FAQs" } };
  }

  const faq = await Faq.findOne({ _id: faqId, ...resolveOrgQuery(auth) });
  if (!faq) {
    return { success: false, error: { code: "NOT_FOUND", message: "FAQ not found" } };
  }

  const allowedUpdates = ["question", "answer", "category", "is_active", "status"];
  allowedUpdates.forEach(key => {
    if (updates[key] !== undefined) {
      faq[key] = updates[key];
    }
  });

  await faq.save();
  return { success: true, data: faq };
};

export const createUser = async (auth, { organizationId, name, email, phone, role, password, branchId }) => {
  const { User } = getModels();

  if (auth.role !== "admin" && auth.role !== "super_admin") {
    return { success: false, error: { code: "FORBIDDEN", message: "Only organization admins can create users" } };
  }

  const targetOrg = (auth.role === "super_admin" && organizationId) ? organizationId : auth.organizationId;
  const resolvedBranch = await resolveBranchId(auth, branchId) || (auth.role === "super_admin" ? null : auth.branchIds[0]);

  const newUser = await User.create({
    name,
    email,
    phone,
    role: role || "customer",
    password,
    organization_id: targetOrg || null,
    branch_id: resolvedBranch,
    status: "active"
  });

  return { success: true, data: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } };
};

export const updateUser = async (auth, { targetUserId, updates = {} }) => {
  const { User } = getModels();
  if (auth.role !== "admin" && auth.role !== "super_admin") {
    return { success: false, error: { code: "FORBIDDEN", message: "Only organization admins can update users" } };
  }

  const user = await User.findOne({ _id: targetUserId, ...resolveOrgQuery(auth) });
  if (!user) {
    return { success: false, error: { code: "NOT_FOUND", message: "User not found" } };
  }

  const allowedUpdates = ["name", "phone", "role", "branch_id", "status"];
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      if (key === "branch_id") {
        const resolved = await resolveBranchId(auth, updates[key]);
        user[key] = resolved;
      } else {
        user[key] = updates[key];
      }
    }
  }

  await user.save();
  return { success: true, data: { _id: user._id, name: user.name, role: user.role, status: user.status } };
};

export const disableUser = async (auth, { targetUserId }) => {
  return updateUser(auth, { targetUserId, updates: { status: "inactive" } });
};

export const createBranch = async (auth, { organizationId, name, code, address, phone, email }) => {
  const { Branch } = getModels();
  if (auth.role !== "admin" && auth.role !== "super_admin") {
    return { success: false, error: { code: "FORBIDDEN", message: "Only organization admins can manage branches" } };
  }

  const targetOrg = (auth.role === "super_admin" && organizationId) ? organizationId : auth.organizationId;

  const branch = await Branch.create({
    organization_id: targetOrg || null,
    name,
    code,
    address,
    phone,
    email,
    status: "active"
  });

  return { success: true, data: branch };
};

export const updateBranch = async (auth, { branchId, updates = {} }) => {
  const { Branch } = getModels();
  if (auth.role !== "admin" && auth.role !== "super_admin") {
    return { success: false, error: { code: "FORBIDDEN", message: "Only organization admins can manage branches" } };
  }

  const branch = await Branch.findOne({ _id: branchId, ...resolveOrgQuery(auth) });
  if (!branch) {
    return { success: false, error: { code: "NOT_FOUND", message: "Branch not found" } };
  }

  const allowedUpdates = ["name", "code", "address", "phone", "email", "status"];
  allowedUpdates.forEach(key => {
    if (updates[key] !== undefined) {
      branch[key] = updates[key];
    }
  });

  await branch.save();
  return { success: true, data: branch };
};

// ── SUPER ADMIN (APPLICATION LEVEL) ACTION TOOLS ───────────────────────────

export const createOrganization = async (auth, { name, email, code, phone, address, domain }) => {
  if (auth.role !== "super_admin") {
    return { success: false, error: { code: "FORBIDDEN", message: "Only super admins can create organizations" } };
  }
  const { Organization, Role } = getModels();
  const org = await Organization.create({ name, email, code, phone, address, domain, status: "active" });
  return { success: true, data: org };
};

export const updateOrganizationStatus = async (auth, { organizationId, status }) => {
  if (auth.role !== "super_admin") {
    return { success: false, error: { code: "FORBIDDEN", message: "Only super admins can update organizations" } };
  }
  const { Organization } = getModels();
  if (!["active", "suspended"].includes(status)) {
    return { success: false, error: { code: "INVALID_ARG", message: "Status must be active or suspended" } };
  }
  const org = await Organization.findById(organizationId);
  if (!org) {
    return { success: false, error: { code: "NOT_FOUND", message: "Organization not found" } };
  }
  org.status = status;
  await org.save();

  if (status === "suspended") {
    await getModels().User.updateMany({ organization_id: org._id }, { status: "disabled" });
  } else {
    await getModels().User.updateMany({ organization_id: org._id, status: "disabled" }, { status: "active" });
  }

  return { success: true, data: org };
};

// ── REFUND TOOLS (Topic-specific, mapping to Tickets with category 'refund') ──

export const get_refund = async (auth, { refundId }) => {
  const result = await getTicketDetails(auth, refundId);
  if (result.success && result.data.category !== "refund") {
    return { success: false, error: { code: "INVALID_CATEGORY", message: "This ticket is not a refund request." } };
  }
  return result;
};

export const check_refund_eligibility = async (auth, { userId }) => {
  const { User } = getModels();
  const targetId = userId || auth.userId;
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return { success: false, error: { code: "INVALID_ARG", message: "Invalid user ID" } };
  }
  const user = await User.findById(targetId).lean();
  if (!user) {
    return { success: false, error: { code: "NOT_FOUND", message: "User not found" } };
  }
  // Mock business rule: Eligible if account is active
  const isEligible = user.status === "active";
  return {
    success: true,
    data: {
      userId: targetId,
      eligible: isEligible,
      reason: isEligible ? "User account is in active standing." : "Suspended user accounts are ineligible for refunds."
    }
  };
};

export const create_refund = async (auth, { userId, subject, description, priority = "medium", branchId }) => {
  return createTicket(auth, {
    userId,
    subject: subject || "Refund Request",
    description,
    priority,
    category: "refund",
    branchId
  });
};

export const update_refund = async (auth, { refundId, updates = {} }) => {
  // Ensure updates are restricted to safety
  const allowed = ["status", "priority", "description"];
  const sanitizedUpdates = {};
  allowed.forEach(k => {
    if (updates[k] !== undefined) sanitizedUpdates[k] = updates[k];
  });
  return updateTicket(auth, { ticketId: refundId, updates: sanitizedUpdates });
};
