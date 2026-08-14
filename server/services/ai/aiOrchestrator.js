import { generateResponse } from "../../modules/llm/index.js";
import { processAIMessage } from "../../modules/chat/aiChat.service.js";
import * as businessTools from "../business-ai/businessTools.js";
import { normalizeRoleName } from "../../utils/constants.js";
import mongoose from "mongoose";
import agentService from "../../modules/agent/agentService.js";

const ALLOWED_MODELS = ["llama3.2:3b", "qwen2.5:7b", "llama3.1:8b"];
const DEFAULT_MODEL = "llama3.2:3b"; // Fallback to llama3.2 since it is present

/**
 * Builds the authentication context from req.user
 */
export const getAuthContext = (user) => {
  if (!user) {
    throw new Error("Unauthorized: User session missing.");
  }
  const rawRole =
    user.roleName ||
    (typeof user.role === "string" ? user.role : null) ||
    (Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : null) ||
    user.role_id?.role_name ||
    user.role_id?.name ||
    null;
  const role = normalizeRoleName(rawRole);
  const organizationId = user.organization_id?._id || user.organization_id;
  const branchId = user.branch_id?._id || user.branch_id;
  const branchIds = branchId ? [branchId.toString()] : [];

  return {
    userId: (user._id || user.userId)?.toString(),
    organizationId: organizationId?.toString(),
    role,
    branchIds,
    isSuperAdmin: role === "super_admin",
    permissions: []
  };
};

const MODEL_PROFILES = {
  fast: "llama3.2:3b",
  balanced: "qwen2.5:7b",
  quality: "llama3.1:8b"
};

const validateModel = (model) => {
  if (!model) return DEFAULT_MODEL;
  const normalized = model.toLowerCase().trim();
  if (MODEL_PROFILES[normalized]) return MODEL_PROFILES[normalized];
  if (ALLOWED_MODELS.includes(model)) return model;
  return DEFAULT_MODEL;
};

// Check if tool name is a write/destructive operation requiring confirmation
const isWriteOperation = (toolName) => {
  const writeTools = [
    "sendNotification",
    "createTicket",
    "updateTicket",
    "assignTicket",
    "updateDocumentStatus",
    "createFAQ",
    "updateFAQ",
    "createUser",
    "updateUser",
    "disableUser",
    "createBranch",
    "updateBranch",
    "createOrganization",
    "updateOrganizationStatus",
  ];
  return writeTools.includes(toolName);
};
const TOOL_SYSTEM_PROMPT = `
You are the Business AI assistant for a customer-support system.

Your job is to understand the user's request and select the correct business tool.

You work only with live application/business data.
Do not answer knowledge-base or RAG questions.

The authenticated user's role determines the scope of data you may access:
- super_admin  → APPLICATION (platform) scope: all organizations, branches, users, and audit logs across the entire platform.
- admin        → ORGANIZATION scope: everything within a single organization (all branches of that organization).
- branch_admin → BRANCH scope: only the data of the branch the user belongs to.
- support      → BRANCH scope: only the data of the branch the user belongs to.

Only expose the data the role can legally see. If the requested data is outside the user's scope, select a FORBIDDEN/unsupported response.

AVAILABLE READ-ONLY TOOLS:

PLATFORM (super_admin only):
- getOrganizationDetails()
- getOrganizations(filters: { status, search })
- getPlatformStats()
- getAuditLogs(filters: { organizationId, action })

ORGANIZATION / BRANCH:
- getOrganizationDetails()
- getBranches()
- getUsers(filters: { role, status, branchId, organizationId })
- getUserDetails(userId)
- getTickets(filters: { status, priority, branchId, organizationId })
- getTicketDetails(ticketId)
- getDocuments(filters: { status, branchId, organizationId, visiblity })
- getDocumentStatus(docId)
- getNotifications(filters: { branchId, organizationId })
- getFAQs(filters: { category, isActive })
- getReports()
- getPendingItems()

AVAILABLE ACTION TOOLS:

These actions require confirmation before execution.

- sendNotification(args: {
    branchId,
    title,
    message,
    type,
    organizationId       // optional, super_admin only
  })

- createTicket(args: {
    userId,
    subject,
    description,
    priority,
    category,
    branchId,
    organizationId       // optional, super_admin only
  })

- updateTicket(args: {
    ticketId,
    updates: {
      status,
      priority,
      category,
      subject,
      description
    }
  })

- assignTicket(args: {
    ticketId,
    assignedToId
  })

- updateDocumentStatus(args: {
    docId,
    status
  })

- createFAQ(args: {
    question,
    answer,
    category,
    is_active,
    organizationId        // optional, super_admin only
  })

- updateFAQ(args: {
    faqId,
    updates
  })

- createUser(args: {
    name,
    email,
    phone,
    role,
    password,
    branchId,
    organizationId        // optional, super_admin only
  })

- updateUser(args: {
    targetUserId,
    updates
  })

- disableUser(args: {
    targetUserId
  })

- createBranch(args: {
    name,
    code,
    address,
    phone,
    email,
    organizationId        // optional, super_admin only
  })

- updateBranch(args: {
    branchId,
    updates
  })

- createOrganization(args: {          // super_admin only
    name,
    email,
    code,
    phone,
    address,
    domain
  })

- updateOrganizationStatus(args: {    // super_admin only
    organizationId,
    status   // "active" | "suspended"
  })

CRITICAL RULES:

1. Output exactly ONE valid JSON object.
2. Do not output markdown.
3. Do not output explanations or additional text.
4. Never generate MongoDB queries.
5. Never generate database commands.
6. Never invent IDs when an ID is required.
7. Never invent database information.
8. Use only the tools listed above.
9. For read requests, select the appropriate READ tool.
10. For write/action requests, select the appropriate ACTION tool.
11. Action tools must always return "requiresConfirmation": true.
12. The backend is responsible for authentication, authorization, organization scope, branch scope, validation, and actual tool execution.
13. Do not assume that the user has permission to perform an action.
14. Do not execute actions yourself. Only identify the required action and arguments.
15. If required information is missing, return a "clarification" response instead of inventing values.
16. If the request does not match a business tool, return "unsupported".
17. A non-super_admin requesting platform-wide data (other organizations) must return "unsupported" with message "Request requires super admin access".

OUTPUT TYPES:

READ TOOL:

{
  "type": "tool",
  "tool": "getUsers",
  "args": {
    "status": "active"
  }
}

ACTION TOOL:

{
  "type": "action",
  "tool": "sendNotification",
  "requiresConfirmation": true,
  "args": {
    "branchId": "branch_id",
    "title": "Notification",
    "message": "Office will close at 5 PM today.",
    "type": "general"
  }
}

CLARIFICATION:

{
  "type": "clarification",
  "message": "Which branch should I use?"
}

UNSUPPORTED:

{
  "type": "unsupported",
  "message": "This request is outside the Business AI capabilities."
}

EXAMPLES:

User:
"How many users are active?"

Output:
{
  "type": "tool",
  "tool": "getUsers",
  "args": {
    "status": "active"
  }
}

User:
"Show pending tickets"

Output:
{
  "type": "tool",
  "tool": "getTickets",
  "args": {
    "status": "pending"
  }
}

User:
"Show high priority open tickets in Chennai"

Output:
{
  "type": "tool",
  "tool": "getTickets",
  "args": {
    "status": "open",
    "priority": "high",
    "branchId": "Chennai"
  }
}

User:
"Show user 123"

Output:
{
  "type": "tool",
  "tool": "getUserDetails",
  "args": {
    "userId": "123"
  }
}

User:
"How many documents are pending?"

Output:
{
  "type": "tool",
  "tool": "getDocuments",
  "args": {
    "status": "pending"
  }
}

User:
"Send a notification to Chennai saying the office closes at 5 PM"

Output:
{
  "type": "action",
  "tool": "sendNotification",
  "requiresConfirmation": true,
  "args": {
    "branchId": "Chennai",
    "title": "Office Closing",
    "message": "The office will close at 5 PM today.",
    "type": "general"
  }
}

User:
"Update ticket 123 to high priority"

Output:
{
  "type": "action",
  "tool": "updateTicket",
  "requiresConfirmation": true,
  "args": {
    "ticketId": "123",
    "updates": {
      "priority": "high"
    }
  }
}

User:
"Show platform statistics"

Output:
{
  "type": "tool",
  "tool": "getPlatformStats",
  "args": {}
}

User:
"List all organizations"

Output:
{
  "type": "tool",
  "tool": "getOrganizations",
  "args": {}
}

User:
"Show recent audit logs"

Output:
{
  "type": "tool",
  "tool": "getAuditLogs",
  "args": {}
}

User:
"Suspend organization 60f..."  (super_admin only)

Output:
{
  "type": "action",
  "tool": "updateOrganizationStatus",
  "requiresConfirmation": true,
  "args": {
    "organizationId": "60f...",
    "status": "suspended"
  }
}

User:
"Create a ticket for John about login failure"

Output:
{
  "type": "clarification",
  "message": "I need the user's ID, branch, priority, category, subject, and description before creating the ticket."
}

User:
"Delete everything"

Output:
{
  "type": "unsupported",
  "message": "This action is not supported."
}
`;

const fallbackKeywordClassifier = (message) => {
  const lower = message.toLowerCase();
  
  if (lower.includes("how many") || lower.includes("count") || lower.includes("show") || lower.includes("list") || lower.includes("get")) {
    if (lower.includes("platform stat") || (lower.includes("platform") && (lower.includes("stat") || lower.includes("overview"))) || lower.includes("system stat")) {
      return { type: "tool", tool: "getPlatformStats", args: {} };
    }
    if ((lower.includes("organization") || lower.includes("organisation") || lower.includes("tenant")) && !lower.includes("setting") && !lower.includes("detail")) {
      return { type: "tool", tool: "getOrganizations", args: {} };
    }
    if (lower.includes("audit") && (lower.includes("log") || lower.includes("trail"))) {
      return { type: "tool", tool: "getAuditLogs", args: {} };
    }
    if (lower.includes("user")) {
      const filters = {};
      if (lower.includes("admin")) filters.role = "admin";
      else if (lower.includes("customer")) filters.role = "customer";
      else if (lower.includes("support")) filters.role = "support";
      
      if (lower.includes("active")) filters.status = "active";
      else if (lower.includes("inactive")) filters.status = "inactive";
      
      return { type: "tool", tool: "getUsers", args: filters };
    }
    if (lower.includes("ticket")) {
      const filters = {};
      if (lower.includes("open")) filters.status = "open";
      else if (lower.includes("pending") || lower.includes("progress")) filters.status = "in_progress";
      else if (lower.includes("resolved")) filters.status = "resolved";
      else if (lower.includes("closed")) filters.status = "closed";
      return { type: "tool", tool: "getTickets", args: filters };
    }
    if (lower.includes("branch")) {
      return { type: "tool", tool: "getBranches", args: {} };
    }
    if (lower.includes("document")) {
      const filters = {};
      if (lower.includes("pending")) filters.status = "pending";
      else if (lower.includes("approved")) filters.status = "approved";
      return { type: "tool", tool: "getDocuments", args: filters };
    }
    if (lower.includes("notification")) {
      return { type: "tool", tool: "getNotifications", args: {} };
    }
    if (lower.includes("faq")) {
      return { type: "tool", tool: "getFAQs", args: {} };
    }
    if (lower.includes("report")) {
      return { type: "tool", tool: "getReports", args: {} };
    }
    if (lower.includes("pending")) {
      return { type: "tool", tool: "getPendingItems", args: {} };
    }
  }
  return null;
};


export const processOrchestratedMessage = async (params) => {
  return await agentService.processAgentMessage(params);
};
