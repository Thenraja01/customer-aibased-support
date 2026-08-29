export const ADMIN_ROLES = ["super_admin", "admin", "branch_admin"];

export const RESTRICTED_ROLES = ["super_admin", "admin", "branch_admin"];

export const RESTRICTED_ROLE_KEYS = ["super_admin", "admin", "branch_admin"];

export const REQUESTABLE_ROLE_KEYS = ["support", "customer"];

/**
 * Role hierarchy — levels represent descending privilege.
 * Level 0 has the most access; higher numbers have less.
 *
 *   Level 0  SUPER_ADMIN   Platform owner. Creates and manages organizations and all admins.
 *   Level 1  ADMIN         Organization administrator. Creates branches, branch admins, support, customers.
 *   Level 2  BRANCH_ADMIN  Manages a single branch, its support staff, and customers.
 *   Level 3  SUPPORT       Assists customers within their assigned branch.
 *   Level 4  CUSTOMER      End user with access only to their own account.
 */
export const ROLE_KEYS = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  BRANCH_ADMIN: "branch_admin",
  SUPPORT: "support",
  CUSTOMER: "customer",
};

export const ROLE_LEVELS = {
  [ROLE_KEYS.SUPER_ADMIN]: 0,
  [ROLE_KEYS.ADMIN]: 1,
  [ROLE_KEYS.BRANCH_ADMIN]: 2,
  [ROLE_KEYS.SUPPORT]: 3,
  [ROLE_KEYS.CUSTOMER]: 4,
};

/** Highest level (lowest privilege) in the hierarchy. */
export const HIGHEST_ROLE_LEVEL = Math.max(...Object.values(ROLE_LEVELS));

/**
 * Return the hierarchy level for a role name, or the highest (least
 * privileged) level when the role is unknown.
 */
export const roleLevel = (roleName) => {
  const normalized = normalizeRoleName(roleName);
  return typeof ROLE_LEVELS[normalized] === "number"
    ? ROLE_LEVELS[normalized]
    : HIGHEST_ROLE_LEVEL;
};

export const roleAtOrAboveLevel = (roleName, requiredLevel) => {
  return roleLevel(roleName) <= requiredLevel;
};

export const rolesAtOrAboveLevel = (requiredLevel) =>
  Object.values(ROLE_KEYS).filter(
    (key) => roleLevel(key) <= requiredLevel
  );

export const TICKET_CATEGORIES = ["bug", "feature_request", "question", "billing", "account", "complaint", "refund", "technical_issue", "technical", "sales_inquiry", "password_reset", "general", "other"];
export const TICKET_STATUSES = ["open", "assigned", "in_progress", "waiting_for_customer", "escalated", "resolved", "closed", "reopened", "cancelled"];
export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"];
export const TICKET_SOURCES = ["customer", "chat", "escalation", "email", "api"];

export const TICKET_DEPARTMENTS = [
  "billing",
  "technical",
  "sales",
  "account",
  "product",
  "general",
];
export const DEFAULT_SLA_TARGETS = {
  urgent: { first_response_minutes: 30, resolution_minutes: 240 },
  high: { first_response_minutes: 60, resolution_minutes: 480 }, 
  medium: { first_response_minutes: 240, resolution_minutes: 1440 }, 
  low: { first_response_minutes: 720, resolution_minutes: 2880 }, // 48h
};

export const SLA_WARNING_FRACTION = 0.25;

export const TICKET_TRANSITIONS = {
  open: ["assigned", "in_progress", "pending", "closed", "waiting_for_customer", "escalated", "cancelled"],
  assigned: ["in_progress", "pending", "resolved", "closed", "waiting_for_customer", "escalated"],
  in_progress: ["waiting_for_customer", "resolved", "closed", "escalated"],
  pending: ["in_progress", "pending", "resolved", "closed", "waiting_for_customer", "escalated"],
  waiting_for_customer: ["in_progress", "resolved", "closed", "escalated"],
  escalated: ["in_progress", "resolved", "closed", "waiting_for_customer"],
  resolved: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["in_progress", "pending", "assigned", "waiting_for_customer"],
  cancelled: [],
};

// Escalation levels (L1 support → L2 → branch_admin → admin).
export const ESCALATION_TARGETS = ["support", "branch_admin", "admin"];
export const ESCALATION_LEVELS = { support: 1, branch_admin: 2, admin: 3 };

// Auto-assignment strategy keys.
export const ASSIGNMENT_STRATEGIES = [
  "round_robin",
  "least_loaded",
  "skill_based",
  "priority_aware",
  "weighted",
  "hybrid",
];
export const DEFAULT_ASSIGNMENT_STRATEGY = "hybrid";

// Default per-agent capacity cap for open tickets.
export const DEFAULT_MAX_ACTIVE_TICKETS = 10;

// Weighted workload per priority (used to measure agent load).
export const PRIORITY_WEIGHTS = { simple: 1, normal: 2, complex: 4, critical: 8, low: 1, medium: 2, high: 4, urgent: 8 };

export const CHAT_STATUSES = ["open", "closed"];
export const CHAT_PRIORITIES = ["low", "medium", "high", "urgent"];

export const DOCUMENT_STATUSES = ["draft", "pending", "approved", "rejected", "published", "archived"];

// Lifecycle enforced by updateDocumentStatus / approve / publish / archive.
// draft → pending → approved → published → archived
// pending → rejected (may resubmit → pending)
// approved → rejected / archived
// archived → draft (restore)
export const DOCUMENT_TRANSITIONS = {
  draft: ["pending", "archived"],
  pending: ["approved", "rejected", "draft"],
  approved: ["published", "rejected", "archived"],
  published: ["archived"],
  rejected: ["pending"],
  archived: ["draft"],
};

export const normalizeRoleName = (roleName) => {
  if (!roleName) return "";
  return roleName.toLowerCase().trim().replace(/[\s_]+/g, "_");
};

export const isNormalizedAdminRole = (normalizedRole) => {
  return ADMIN_ROLES.includes(normalizedRole);
};

/**
 * Check if user has any of the specified roles
 * @param {string} userRole - User's role
 * @param {...string} allowedRoles - Roles to check against
 * @returns {boolean}
 */
export const hasAnyRole = (userRole, ...allowedRoles) => {
  if (!userRole) return false;
  const normalized = normalizeRoleName(userRole);
  return allowedRoles.some(role => normalizeRoleName(role) === normalized);
};

/**
 * Check if user has a specific role
 * @param {string} userRole - User's role
 * @param {string} role - Role to check
 * @returns {boolean}
 */
export const hasRole = (userRole, role) => {
  if (!userRole) return false;
  return normalizeRoleName(userRole) === normalizeRoleName(role);
};

/**
 * Check if user is super admin
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export const isSuperAdmin = (userRole) => {
  return hasRole(userRole, "super_admin");
};

/**
 * Check if user is admin or super admin
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export const isAdminOrAbove = (userRole) => {
  return hasAnyRole(userRole, "super_admin", "admin");
};

/**
 * Check if user is branch admin or above
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export const isBranchAdminOrAbove = (userRole) => {
  return hasAnyRole(userRole, "super_admin", "admin", "branch_admin");
};

/**
 * Check if user is support or above
 * @param {string} userRole - User's role
 * @returns {boolean}
 */
export const isSupportOrAbove = (userRole) => {
  return hasAnyRole(userRole, "super_admin", "admin", "branch_admin", "support");
};

export const DEFAULT_TICKET_FORM_CONFIG = [
  { field_key: "subject", label: "Subject", enabled: true, required: true, order: 1 },
  { field_key: "description", label: "Description", enabled: true, required: true, order: 2 },
  { field_key: "category", label: "Category", enabled: true, required: true, order: 3 },
  { field_key: "priority", label: "Priority", enabled: true, required: false, order: 4 },
  { field_key: "attachment", label: "Attachment", enabled: true, required: false, order: 5 },
  { field_key: "phone", label: "Phone Number", enabled: false, required: false, order: 6 },
  { field_key: "order_id", label: "Order ID", enabled: false, required: false, order: 7 },
];