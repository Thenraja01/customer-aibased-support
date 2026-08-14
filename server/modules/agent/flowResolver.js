import AgentFlow from "./agentFlow.schema.js";
import { resolveScope } from "./rbacGate.js";

/**
 * Flow Resolver — implements a find-or-create pattern for agent flows.
 *
 * A "flow" is a persisted plan of one or more steps derived from an intent.
 * Before creating a new flow we look for an existing flow that is either
 * already running for the same chat, or an open flow that matches the same
 * intent/tool so repeated requests can continue rather than spawn duplicates.
 */

const OPEN_STATUSES = ["draft", "running"];

const buildFlowKey = (intent) => {
  if (intent?.tool) return `tool:${intent.tool}`;
  if (intent?.type) return `type:${intent.type}`;
  return "unknown";
};

const stepsFromIntent = (intent, message) => {
  if (!intent) return [];
  const args = intent.args || {};
  switch (intent.type) {
    case "tool":
      return [{ action: "read", tool: intent.tool, args, requiresConfirmation: false }];
    case "action":
      return [{ action: "write", tool: intent.tool, args, requiresConfirmation: intent.requiresConfirmation !== false }];
    case "rag":
      return [{ action: "rag", tool: "RAGQuery", args: { query: intent.query || message }, requiresConfirmation: false }];
    default:
      return [];
  }
};

/**
 * Find an existing open flow that this message should continue, or create a new one.
 *
 * Matching strategy:
 *   1. Same chat, still open → reuse (conversation continuity).
 *   2. Otherwise, an open flow with the same tool in the same org → reuse if
 *      created within a short window (prevents dupes for repeat requests).
 *   3. Otherwise → create a fresh flow.
 */
export const findOrCreateFlow = async ({
  organizationId,
  user,
  chatId = null,
  intent = null,
  message = "",
}) => {
  const scope = resolveScope(user);
  const key = buildFlowKey(intent);
  const intentSteps = stepsFromIntent(intent, message);
  const toolName = intent?.tool || null;

  let flow = null;
  let found = false;

  // 1. Same chat, still open
  if (chatId) {
    const sameChat = await AgentFlow.findOne({
      chat_id: chatId,
      status: { $in: OPEN_STATUSES },
    })
      .sort({ created_at: -1 })
      .lean();
    if (sameChat) {
      flow = sameChat;
      found = true;
    }
  }

  // 2. Recent open flow with same tool (dedupe)
  if (!flow && toolName && organizationId) {
    const recent = await AgentFlow.findOne({
      organization_id: organizationId,
      status: { $in: OPEN_STATUSES },
      intent: { tool: toolName },
      created_at: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    })
      .sort({ created_at: -1 })
      .lean();
    if (recent) {
      flow = recent;
      found = true;
    }
  }

  // 3. Create new
  if (!flow) {
    flow = await AgentFlow.create({
      organization_id: organizationId || scope.organizationId,
      branch_id: scope.branchId,
      user_id: scope.userId,
      chat_id: chatId,
      role: scope.role,
      intent: {
        type: intent?.type || "unknown",
        tool: intent?.tool || null,
        confidence: intent?.confidence || 0,
        params: intent?.args || {},
      },
      source_message: message,
      steps: intentSteps,
      status: "draft",
      flow_key: key,
    });
    found = false;
  }

  return { flow, found, scope, key };
};

export default { findOrCreateFlow };
