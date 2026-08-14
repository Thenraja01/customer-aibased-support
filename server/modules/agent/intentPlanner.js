import { generateResponse } from "../llm/index.js";
import { buildToolPromptForRole, isWriteAction, normalizeToolName } from "./actionRegistry.js";
import { scopePolicyPrompt } from "./rbacGate.js";
import { resolveActionForRole } from "./rbacGate.js";

/**
 * Intent Planner — extracts a structured intent from a user message using the
 * LLM with a role-filtered tool prompt. Falls back to a deterministic keyword
 * classifier when the LLM is unavailable or returns unparseable JSON.
 */

const FALLBACK_TOOLS = [
  "getOrganizations",
  "getPlatformStats",
  "getAuditLogs",
  "getOrganizationDetails",
  "getBranches",
  "getUsers",
  "getUserDetails",
  "getTickets",
  "getTicketDetails",
  "getDocuments",
  "getDocumentStatus",
  "getNotifications",
  "getFAQs",
  "getReports",
  "getPendingItems",
  "get_refund",
  "check_refund_eligibility",
];

const buildIntentPrompt = ({ message, role, scope, conversationHistory = "" }) => `
You are the Business AI intent planner for a customer-support platform.

Your ONLY job is to classify the user's latest message into a structured intent.

ROLE: ${role || "unknown"}
SCOPE: ${scopePolicyPrompt(scope, role)}

Only ever select tools the user's role is allowed to use.
If the request needs a tool outside the role's scope, or no tool applies, respond with type "unsupported".
If information is missing to run a tool, respond with type "clarification".

${buildToolPromptForRole(role)}

RULES:
1. Output exactly ONE JSON object — nothing else, no markdown.
2. Never invent IDs. Use "clarification" when an ID is missing.
3. A non-super_admin requesting platform-wide data must be "unsupported".
4. Write actions (create/update/disable/send/assign) MUST include "requiresConfirmation": true.

OUTPUT SCHEMA:
Read:      { "type": "tool", "tool": "<function name>", "args": { ... } }
Action:    { "type": "action", "tool": "<function name>", "requiresConfirmation": true, "args": { ... } }
Clarify:   { "type": "clarification", "message": "..." }
Unsupported: { "type": "unsupported", "message": "..." }
RAG:       { "type": "rag", "query": "..." }

EXAMPLES:
User: "How many pending tickets are there?"
Output: { "type": "tool", "tool": "getTickets", "args": { "status": "pending" } }

User: "Show pending items"
Output: { "type": "tool", "tool": "getPendingItems", "args": {} }

User: "How many active users are there?"
Output: { "type": "tool", "tool": "getUsers", "args": { "status": "active" } }

User: "Show platform statistics"
Output: { "type": "tool", "tool": "getPlatformStats", "args": {} }

${conversationHistory ? `RECENT CONVERSATION:\n${conversationHistory}` : ""}

CURRENT USER REQUEST: "${message}"
`;

/**
 * Normalizes and extracts tool name from model JSON response across varying schema keys
 * (e.g. tool, tool_name, name, function, action). Also treats literal "undefined"/"null"
 * values and empty strings as "no tool", so they never propagate into execution.
 */
export const extractToolNameFromParsed = (parsed) => {
  if (!parsed || typeof parsed !== "object") return null;
  const raw =
    parsed.tool ||
    parsed.tool_name ||
    parsed.name ||
    parsed.function ||
    parsed.action ||
    parsed.tool_call?.name ||
    parsed.function_call?.name ||
    null;
  if (!raw || typeof raw !== "string") return null;
  return normalizeToolName(raw);
};

const extractJson = (text) => {
  if (!text) return null;
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) return null;
  try {
    return JSON.parse(text.substring(first, last + 1));
  } catch {
    return null;
  }
};

const keywordClassifier = (message, role) => {
  const lower = message.toLowerCase();

  // Quantitative queries for tickets must take priority over generic RAG
  if (lower.includes("ticket")) {
    const args = {};
    if (lower.includes("open")) args.status = "open";
    else if (lower.includes("pending")) args.status = "pending";
    else if (lower.includes("resolved")) args.status = "resolved";
    else if (lower.includes("closed")) args.status = "closed";
    return { type: "tool", tool: "getTickets", args };
  }

  // platform tools — super_admin only
  if (role === "super_admin") {
    if ((lower.includes("platform stat") || lower.includes("system stat")) && (lower.includes("show") || lower.includes("get") || lower.includes("list"))) {
      return { type: "tool", tool: "getPlatformStats", args: {} };
    }
    if ((lower.includes("organization") || lower.includes("organisation") || lower.includes("tenant")) && !lower.includes("detail") && (lower.includes("list") || lower.includes("show") || lower.includes("get"))) {
      return { type: "tool", tool: "getOrganizations", args: {} };
    }
    if ((lower.includes("audit") && (lower.includes("log") || lower.includes("trail")))) {
      return { type: "tool", tool: "getAuditLogs", args: {} };
    }
  }

  if (lower.includes("user")) {
    const args = {};
    if (lower.includes("admin")) args.role = "admin";
    else if (lower.includes("customer")) args.role = "customer";
    else if (lower.includes("support")) args.role = "support";
    if (lower.includes("active")) args.status = "active";
    return { type: "tool", tool: "getUsers", args };
  }
  if (lower.includes("branch")) {
    return { type: "tool", tool: "getBranches", args: {} };
  }
  if (lower.includes("document")) {
    const args = {};
    if (lower.includes("pending")) args.status = "pending";
    else if (lower.includes("approved")) args.status = "approved";
    return { type: "tool", tool: "getDocuments", args };
  }
  if (lower.includes("faq")) {
    return { type: "tool", tool: "getFAQs", args: {} };
  }
  if (lower.includes("notification")) {
    return { type: "tool", tool: "getNotifications", args: {} };
  }
  if (lower.includes("report")) {
    return { type: "tool", tool: "getReports", args: {} };
  }
  if (lower.includes("refund")) {
    if (lower.includes("create") || lower.includes("raise") || lower.includes("new")) {
      return { type: "action", tool: "create_refund", requiresConfirmation: true, args: {} };
    }
    return { type: "tool", tool: "get_refund", args: {} };
  }

  // RAG-style questions fall through to knowledge base
  if (lower.startsWith("how") || lower.startsWith("what") || lower.startsWith("why") || lower.startsWith("when") || lower.includes("?") && lower.split(" ").length > 4) {
    return { type: "rag", query: message };
  }

  return null;
};

/**
 * Extract intent for a message. Returns a normalized intent object.
 */
export const extractIntent = async ({
  message,
  role,
  scope,
  conversationHistory = "",
  provider = null,
  model = null,
  organizationId = null,
}) => {
  const prompt = buildIntentPrompt({ message, role, scope, conversationHistory });

  let llmText = null;
  try {
    const res = await generateResponse(prompt, message, {
      provider,
      model,
      organizationId,
      temperature: 0,
    });
    llmText = res?.text || null;
  } catch (err) {
    console.warn(`[IntentPlanner] LLM failed: ${err.message}`);
  }

  const parsed = extractJson(llmText);
  let extractedToolName = extractToolNameFromParsed(parsed);
  let args = parsed?.args || parsed?.arguments || parsed?.payload || {};
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes("ticket") && extractedToolName === "getReports") {
    extractedToolName = "getTickets";
    if (lowerMsg.includes("pending")) args.status = "pending";
    else if (lowerMsg.includes("open")) args.status = "open";
    else if (lowerMsg.includes("closed")) args.status = "closed";
  }

  if (parsed && extractedToolName) {
    const isWrite = isWriteAction(extractedToolName);
    const intentType = isWrite ? "action" : "tool";
    const gate = resolveActionForRole(role, extractedToolName);
    if (!gate.allowed) {
      return {
        type: "unsupported",
        message: gate.reason || "This request is outside your permissions.",
        raw: parsed,
        confidence: 0,
      };
    }
    return {
      type: intentType,
      tool: extractedToolName,
      args,
      requiresConfirmation: !!parsed.requiresConfirmation || intentType === "action",
      confidence: 1,
      raw: parsed,
    };
  }

  if (parsed && parsed.type === "clarification") {
    return { type: "clarification", message: parsed.message || "Please provide more details.", confidence: 1, raw: parsed };
  }
  if (parsed && parsed.type === "unsupported") {
    return { type: "unsupported", message: parsed.message || "This request is not supported.", confidence: 1, raw: parsed };
  }
  if (parsed && parsed.type === "rag") {
    return { type: "rag", query: parsed.query || message, confidence: 1, raw: parsed };
  }

  // Fallback classifier
  const fallback = keywordClassifier(message, role);
  if (fallback) {
    if ((fallback.type === "tool" || fallback.type === "action") && fallback.tool) {
      const gate = resolveActionForRole(role, fallback.tool);
      if (!gate.allowed) {
        return { type: "unsupported", message: gate.reason || "Not authorized.", confidence: 0.5, raw: fallback };
      }
    }
    return { ...fallback, confidence: 0.5, raw: fallback };
  }
  return { type: "rag", query: message, confidence: 0.4, raw: null };
};

export default { extractIntent };
