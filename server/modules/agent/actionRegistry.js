import * as businessTools from "../../services/business-ai/businessTools.js";
import { normalizeRoleName, ROLE_LEVELS } from "../../utils/constants.js";

const SA   = "super_admin";
const ADM  = "admin";
const BA   = "branch_admin";
const SUP  = "support";
const CUST = "customer";

const ALL_STAFF = [SA, ADM, BA, SUP];
const ADMINS    = [SA, ADM];
const ADMIN_BA  = [SA, ADM, BA];

const REGISTRY = [
  {
    name: "organization.list",
    tool: "getOrganizations",
    handler: businessTools.getOrganizations,
    allowedRoles: [SA],
    category: "platform",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "List all organizations on the platform",
    args: "filters: { status, search }",
  },
  {
    name: "platform.stats",
    tool: "getPlatformStats",
    handler: businessTools.getPlatformStats,
    allowedRoles: [SA],
    category: "platform",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "Retrieve platform-wide statistics",
    args: "()",
  },
  {
    name: "audit.list",
    tool: "getAuditLogs",
    handler: businessTools.getAuditLogs,
    allowedRoles: [SA],
    category: "platform",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "Retrieve platform audit logs",
    args: "filters: { organizationId, action }",
  },

  // ── READ: Organization / Branch ─────────────────────────────
  {
    name: "organization.details",
    tool: "getOrganizationDetails",
    handler: businessTools.getOrganizationDetails,
    allowedRoles: ALL_STAFF,
    category: "organization",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "Get current organization details",
    args: "()",
  },
  {
    name: "branch.list",
    tool: "getBranches",
    handler: businessTools.getBranches,
    allowedRoles: ALL_STAFF,
    category: "branch",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "List branches in the organization",
    args: "()",
  },

  // ── READ: Users ─────────────────────────────────────────────
  {
    name: "user.list",
    tool: "getUsers",
    handler: businessTools.getUsers,
    allowedRoles: ALL_STAFF,
    category: "user",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "List users with optional filters",
    args: "filters: { role, status, branchId, organizationId }",
  },
  {
    name: "user.details",
    tool: "getUserDetails",
    handler: businessTools.getUserDetails,
    allowedRoles: ALL_STAFF,
    category: "user",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "Get a specific user's details",
    args: "userId",
  },

  // ── READ: Tickets ───────────────────────────────────────────
  {
    name: "ticket.list",
    tool: "getTickets",
    handler: businessTools.getTickets,
    allowedRoles: ALL_STAFF,
    category: "ticket",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "List tickets with optional filters",
    args: "filters: { status, priority, branchId, organizationId }",
  },
  {
    name: "ticket.details",
    tool: "getTicketDetails",
    handler: businessTools.getTicketDetails,
    allowedRoles: ALL_STAFF,
    category: "ticket",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "Get a specific ticket's details",
    args: "ticketId",
  },

  // ── READ: Documents ─────────────────────────────────────────
  {
    name: "document.list",
    tool: "getDocuments",
    handler: businessTools.getDocuments,
    allowedRoles: ALL_STAFF,
    category: "document",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "List documents with optional filters",
    args: "filters: { status, branchId, organizationId, visiblity }",
  },
  {
    name: "document.status",
    tool: "getDocumentStatus",
    handler: businessTools.getDocumentStatus,
    allowedRoles: ALL_STAFF,
    category: "document",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "Get processing status of a document",
    args: "docId",
  },

  // ── READ: Notifications ─────────────────────────────────────
  {
    name: "notification.list",
    tool: "getNotifications",
    handler: businessTools.getNotifications,
    allowedRoles: ALL_STAFF,
    category: "notification",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "List notifications",
    args: "filters: { branchId, organizationId }",
  },

  // ── READ: FAQs ──────────────────────────────────────────────
  {
    name: "faq.list",
    tool: "getFAQs",
    handler: businessTools.getFAQs,
    allowedRoles: ALL_STAFF,
    category: "faq",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "List frequently asked questions",
    args: "filters: { category, isActive }",
  },

  // ── READ: Reports / Pending ─────────────────────────────────
  {
    name: "report.summary",
    tool: "getReports",
    handler: businessTools.getReports,
    allowedRoles: ALL_STAFF,
    category: "report",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "Get summary report statistics",
    args: "()",
  },
  {
    name: "pending.list",
    tool: "getPendingItems",
    handler: businessTools.getPendingItems,
    allowedRoles: ALL_STAFF,
    category: "report",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "Get pending tickets and documents",
    args: "()",
  },

  // ── WRITE: Notifications ────────────────────────────────────
  {
    name: "notification.send",
    tool: "sendNotification",
    handler: businessTools.sendNotification,
    allowedRoles: ADMIN_BA,
    category: "notification",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: true,
    description: "Broadcast a notification to users",
    args: "{ branchId, title, message, type, organizationId }",
  },

  // ── WRITE: Tickets ──────────────────────────────────────────
  {
    name: "ticket.create",
    tool: "createTicket",
    handler: businessTools.createTicket,
    allowedRoles: ALL_STAFF,
    category: "ticket",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: true,
    description: "Create a new support ticket",
    args: "{ userId, subject, description, priority, category, branchId, organizationId }",
  },
  {
    name: "ticket.update",
    tool: "updateTicket",
    handler: businessTools.updateTicket,
    allowedRoles: ALL_STAFF,
    category: "ticket",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: false,
    description: "Update a ticket's status, priority or details",
    args: "{ ticketId, updates: { status, priority, category, subject, description } }",
  },
  {
    name: "ticket.assign",
    tool: "assignTicket",
    handler: businessTools.assignTicket,
    allowedRoles: ADMIN_BA,
    category: "ticket",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: false,
    description: "Assign a ticket to a support representative",
    args: "{ ticketId, assignedToId }",
  },

  // ── WRITE: Documents ────────────────────────────────────────
  {
    name: "document.updateStatus",
    tool: "updateDocumentStatus",
    handler: businessTools.updateDocumentStatus,
    allowedRoles: ADMINS,
    category: "document",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: false,
    description: "Approve, reject or archive a document",
    args: "{ docId, status }",
  },

  // ── WRITE: FAQs ─────────────────────────────────────────────
  {
    name: "faq.create",
    tool: "createFAQ",
    handler: businessTools.createFAQ,
    allowedRoles: ADMINS,
    category: "faq",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: false,
    description: "Create a new FAQ entry",
    args: "{ question, answer, category, is_active, organizationId }",
  },
  {
    name: "faq.update",
    tool: "updateFAQ",
    handler: businessTools.updateFAQ,
    allowedRoles: ADMINS,
    category: "faq",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: false,
    description: "Update an existing FAQ entry",
    args: "{ faqId, updates }",
  },

  // ── WRITE: Users ────────────────────────────────────────────
  {
    name: "user.create",
    tool: "createUser",
    handler: businessTools.createUser,
    allowedRoles: ADMINS,
    category: "user",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: false,
    description: "Create a new user account",
    args: "{ name, email, phone, role, password, branchId, organizationId }",
  },
  {
    name: "user.update",
    tool: "updateUser",
    handler: businessTools.updateUser,
    allowedRoles: ADMINS,
    category: "user",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: false,
    description: "Update an existing user",
    args: "{ targetUserId, updates }",
  },
  {
    name: "user.disable",
    tool: "disableUser",
    handler: businessTools.disableUser,
    allowedRoles: ADMINS,
    category: "user",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: false,
    description: "Disable / suspend a user account",
    args: "{ targetUserId }",
  },

  // ── WRITE: Branches ─────────────────────────────────────────
  {
    name: "branch.create",
    tool: "createBranch",
    handler: businessTools.createBranch,
    allowedRoles: ADMINS,
    category: "branch",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: false,
    description: "Register a new branch",
    args: "{ name, code, address, phone, email, organizationId }",
  },
  {
    name: "branch.update",
    tool: "updateBranch",
    handler: businessTools.updateBranch,
    allowedRoles: ADMINS,
    category: "branch",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: false,
    description: "Update branch contact information",
    args: "{ branchId, updates }",
  },

  // ── WRITE: Organizations (super_admin only) ─────────────────
  {
    name: "organization.create",
    tool: "createOrganization",
    handler: businessTools.createOrganization,
    allowedRoles: [SA],
    category: "organization",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: false,
    description: "Create a new organization / tenant",
    args: "{ name, email, code, phone, address, domain }",
  },
  {
    name: "organization.updateStatus",
    tool: "updateOrganizationStatus",
    handler: businessTools.updateOrganizationStatus,
    allowedRoles: [SA],
    category: "organization",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: false,
    description: "Suspend or activate an organization",
    args: "{ organizationId, status }",
  },

  // ── Refund tools ────────────────────────────────────────────
  {
    name: "refund.get",
    tool: "get_refund",
    handler: businessTools.get_refund,
    allowedRoles: ALL_STAFF,
    category: "refund",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "Retrieve details of a refund request",
    args: "{ refundId }",
  },
  {
    name: "refund.checkEligibility",
    tool: "check_refund_eligibility",
    handler: businessTools.check_refund_eligibility,
    allowedRoles: ALL_STAFF,
    category: "refund",
    isWrite: false,
    requiresConfirmation: false,
    requiresBranch: false,
    description: "Check if a user is eligible for a refund",
    args: "{ userId }",
  },
  {
    name: "refund.create",
    tool: "create_refund",
    handler: businessTools.create_refund,
    allowedRoles: ALL_STAFF,
    category: "refund",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: true,
    description: "Create a refund request",
    args: "{ userId, subject, description, priority, branchId }",
  },
  {
    name: "refund.update",
    tool: "update_refund",
    handler: businessTools.update_refund,
    allowedRoles: ALL_STAFF,
    category: "refund",
    isWrite: true,
    requiresConfirmation: true,
    requiresBranch: false,
    description: "Update a refund request",
    args: "{ refundId, updates }",
  },
];

// ── Build lookup indexes ────────────────────────────────────────────

const byName = new Map();
const byTool = new Map();

for (const entry of REGISTRY) {
  byName.set(entry.name, entry);
  byTool.set(entry.tool, entry);
}

// ── Tool name normalization (dispatch-time safety net) ──────────────
// Models occasionally return snake_case, shorthand or slightly-off names.
// This canonicalizes them to registered tool names so execution never
// resolves a raw, non-existent businessTools key.

const TOOL_ALIASES = {
  // Tickets
  get_tickets: "getTickets",
  tickets: "getTickets",
  list_tickets: "getTickets",
  get_pending_tickets: "getTickets",
  pending_tickets: "getTickets",
  get_ticket_details: "getTicketDetails",
  ticket_details: "getTicketDetails",
  // Pending items
  get_pending_items: "getPendingItems",
  pending_items: "getPendingItems",
  get_pending: "getPendingItems",
  pending: "getPendingItems",
  // Users
  get_users: "getUsers",
  users: "getUsers",
  list_users: "getUsers",
  get_user_details: "getUserDetails",
  user_details: "getUserDetails",
  // Branches
  get_branches: "getBranches",
  branches: "getBranches",
  list_branches: "getBranches",
  // Documents
  get_documents: "getDocuments",
  documents: "getDocuments",
  list_documents: "getDocuments",
  get_document_status: "getDocumentStatus",
  document_status: "getDocumentStatus",
  // Organizations
  get_organizations: "getOrganizations",
  organizations: "getOrganizations",
  list_organizations: "getOrganizations",
  get_organization_details: "getOrganizationDetails",
  organization_details: "getOrganizationDetails",
  // Platform stats & Audit
  get_platform_stats: "getPlatformStats",
  platform_stats: "getPlatformStats",
  system_stats: "getPlatformStats",
  get_audit_logs: "getAuditLogs",
  audit_logs: "getAuditLogs",
  // Notifications & FAQs & Reports
  get_notifications: "getNotifications",
  notifications: "getNotifications",
  get_faqs: "getFAQs",
  faqs: "getFAQs",
  get_reports: "getReports",
  reports: "getReports",
  // Refunds
  get_refund: "get_refund",
  refund: "get_refund",
  refund_status: "get_refund",
  check_refund_eligibility: "check_refund_eligibility",
  refund_eligibility: "check_refund_eligibility",
  create_refund: "create_refund",
  raise_refund: "create_refund",
  update_refund: "update_refund",
  // Actions
  send_notification: "sendNotification",
  create_ticket: "createTicket",
  update_ticket: "updateTicket",
  assign_ticket: "assignTicket",
  update_document_status: "updateDocumentStatus",
  create_faq: "createFAQ",
  update_faq: "updateFAQ",
  create_user: "createUser",
  update_user: "updateUser",
  disable_user: "disableUser",
  create_branch: "createBranch",
  update_branch: "updateBranch",
  create_organization: "createOrganization",
  update_organization_status: "updateOrganizationStatus",
};

/**
 * Normalize a raw model/user-supplied tool name to its canonical registered
 * tool name. Returns null for missing, empty or literal "undefined"/"null".
 */
export const normalizeToolName = (name) => {
  if (!name || typeof name !== "string") return null;
  const clean = name.trim();
  if (!clean || clean.toLowerCase() === "undefined" || clean.toLowerCase() === "null") return null;
  return TOOL_ALIASES[clean] || TOOL_ALIASES[clean.toLowerCase()] || clean;
};

/**
 * Resolve a raw tool name to its registry entry (canonical tool + handler),
 * or null when it is not a registered tool. This is the single execution-time
 * resolution point so read/write/confirm dispatch can never reach a missing
 * businessTools key.
 */
export const resolveTool = (name) => {
  const canonical = normalizeToolName(name);
  if (!canonical) return null;
  return byTool.get(canonical) || byTool.get(canonical.toLowerCase()) || null;
};

// ── Public API ──────────────────────────────────────────────────────

/**
 * Get an action entry by its canonical name (e.g. "ticket.create").
 */
export const getAction = (actionName) => byName.get(actionName) || null;

/**
 * Get an action entry by its tool function name (e.g. "createTicket").
 */
export const getActionByTool = (toolName) => byTool.get(toolName) || null;

/**
 * Return all actions visible to a given role.
 */
export const getActionsForRole = (roleName) => {
  const normalized = normalizeRoleName(roleName);
  // super_admin sees everything
  if (normalized === "super_admin") return [...REGISTRY];
  return REGISTRY.filter((a) => a.allowedRoles.includes(normalized));
};

/**
 * Check if a role is authorized to execute a specific action.
 */
export const isRoleAllowed = (roleName, actionName) => {
  const normalized = normalizeRoleName(roleName);
  if (normalized === "super_admin") return true;
  const action = byName.get(actionName);
  if (!action) return false;
  return action.allowedRoles.includes(normalized);
};

/**
 * Check if an action is a write/destructive operation.
 */
export const isWriteAction = (actionNameOrTool) => {
  const action = byName.get(actionNameOrTool) || byTool.get(actionNameOrTool);
  return action?.isWrite ?? false;
};

/**
 * Generate the tool list portion of the LLM system prompt, filtered by role.
 */
export const buildToolPromptForRole = (roleName) => {
  const actions = getActionsForRole(roleName);

  const readTools = actions.filter((a) => !a.isWrite);
  const writeTools = actions.filter((a) => a.isWrite);

  const lines = [];

  if (readTools.length > 0) {
    lines.push("AVAILABLE READ-ONLY TOOLS:\n");
    const byCategory = groupBy(readTools, "category");
    for (const [cat, tools] of Object.entries(byCategory)) {
      lines.push(`${cat.toUpperCase()}:`);
      for (const t of tools) {
        lines.push(`- ${t.tool}(${t.args}) — ${t.description}`);
      }
      lines.push("");
    }
  }

  if (writeTools.length > 0) {
    lines.push("AVAILABLE ACTION TOOLS (require confirmation):\n");
    const byCategory = groupBy(writeTools, "category");
    for (const [cat, tools] of Object.entries(byCategory)) {
      lines.push(`${cat.toUpperCase()}:`);
      for (const t of tools) {
        lines.push(`- ${t.tool}(${t.args}) — ${t.description}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
};

/**
 * Get all registered action names.
 */
export const getAllActionNames = () => REGISTRY.map((a) => a.name);

/**
 * Get all registered tool names.
 */
export const getAllToolNames = () => REGISTRY.map((a) => a.tool);

// ── Helpers ─────────────────────────────────────────────────────────

function groupBy(arr, key) {
  const result = {};
  for (const item of arr) {
    const k = item[key];
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}

export default {
  getAction,
  getActionByTool,
  getActionsForRole,
  isRoleAllowed,
  isWriteAction,
  buildToolPromptForRole,
  getAllActionNames,
  getAllToolNames,
  normalizeToolName,
  resolveTool,
};
