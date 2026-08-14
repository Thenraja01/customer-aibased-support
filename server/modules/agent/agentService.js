import mongoose from "mongoose";
import { generateResponse, getActiveProvider } from "../llm/index.js";
import { processAIMessage } from "../chat/aiChat.service.js";
import { resolveScope, enforceActionAccess } from "./rbacGate.js";
import { extractIntent } from "./intentPlanner.js";
import { resolveTool } from "./actionRegistry.js";
import { findOrCreateFlow } from "./flowResolver.js";
import AgentFlow from "./agentFlow.schema.js";
import { recordAIUsage } from "../ai/ai.service.js";
import { modelHealth } from "./modelHealth.service.js";

/**
 * Agent Service — main orchestration pipeline.
 *
 * Given a user message, it:
 *   1. Resolves the caller's RBAC scope.
 *   2. Planners the intent (LLM + role-filtered tools).
 *   3. Finds-or-creates a persisted AgentFlow.
 *   4. Executes the flow's steps (read tools directly, write tools with
 *      confirmation, RAG otherwise).
 *   5. Summarizes results back through the LLM and persists the reply.
 */

const buildHistory = async (chatId, limit = 10) => {
  const Message = mongoose.model("Message");
  const recent = await Message.find({ chat_id: chatId })
    .sort({ created_at: -1 })
    .limit(limit)
    .lean()
    .catch(() => []);
  return recent
    .reverse()
    .map((m) => `${m.sender_type === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");
};

const persistMessage = async (chatId, senderType, content, isAi) => {
  const Message = mongoose.model("Message");
  await Message.create({
    chat_id: chatId,
    sender_type: senderType,
    content,
    is_ai: isAi,
  }).catch(() => null);
};

const summarizeResult = async ({ text, data, userMessage, provider }) => {
  if (data === null || data === undefined) return text;
  const summaryPrompt = `Summarize these database results for the user:\n${JSON.stringify(data)}\nUser query: "${userMessage}"`;
  const res = await generateResponse(summaryPrompt, userMessage, { provider });
  return res?.text || text;
};

const trackUsage = async ({ provider, organizationId, userId }) => {
  try {
    await recordAIUsage({
      organization_id: organizationId,
      user_id: userId,
      provider: provider || "unknown",
      model: provider || "unknown",
      input_tokens: 0,
      output_tokens: 0,
    });
  } catch {
    // usage tracking is best-effort
  }
};

const executeStep = async ({ step, auth, chatId }) => {
  step.status = "running";
  step.started_at = new Date();

  if (step.action === "write") {
    // Write actions must be gated + confirmed before any execution
    const resolved = resolveTool(step.tool);
    const gate = enforceActionAccess(auth.role, resolved?.tool || step.tool);
    if (!gate.allowed) {
      step.status = "failed";
      step.error = gate.reason;
      return { step, pending: null };
    }
    step.status = "completed";
    step.completed_at = new Date();
    const actionName = resolved?.tool || step.tool;
    return {
      step,
      pending: {
        action: actionName,
        payload: step.args || {},
        preview: { message: `Trigger "${actionName}" with ${JSON.stringify(step.args || {})}` },
      },
    };
  }

  if (step.action === "rag") {
    try {
      const ragMsg = await processAIMessage({
        chatId,
        userId: auth.userId,
        userMessage: step.args?.query || "",
        organizationId: auth.organizationId,
        roleName: auth.role,
      });
      step.status = "completed";
      step.completed_at = new Date();
      step.result = { text: ragMsg?.content || "" };
      return { step, data: null, text: ragMsg?.content || "" };
    } catch (err) {
      step.status = "failed";
      step.error = err.message;
      return { step, error: err.message };
    }
  }

  // Read tool validation
  if (!step.tool || typeof step.tool !== "string" || !step.tool.trim()) {
    step.status = "failed";
    step.error = "Invalid tool call: tool name is missing or invalid.";
    return { step, error: step.error };
  }

  const toolName = step.tool.trim();
  // Resolve through the canonical registry so aliases / shorthand names from the
  // model never reach a missing businessTools key.
  const action = resolveTool(toolName);
  if (!action) {
    step.status = "failed";
    step.error = `Tool "${toolName}" is not implemented.`;
    return { step, error: step.error };
  }
  try {
    const toolResult = await action.handler(auth, step.args || {});
    if (!toolResult?.success) {
      step.status = "failed";
      step.error = toolResult?.error?.message || toolResult?.error?.code || "Tool execution failed";
      return { step, error: step.error };
    }
    step.status = "completed";
    step.completed_at = new Date();
    step.result = toolResult.data || null;
    return { step, data: toolResult.data || null };
  } catch (err) {
    step.status = "failed";
    step.error = err.message;
    return { step, error: err.message };
  }
};

/**
 * Orchestrate a full agent turn. Returns the final assistant reply object.
 */
export const processAgentMessage = async ({
  chatId,
  user,
  message,
  modelName = null,
  actionConfirm = null,
  provider = null,
}) => {
  const auth = resolveScope(user);
  const activeProvider = provider || getActiveProvider?.() || "ollama";

  const start = async (reply, extra = {}) => {
    if (reply && chatId) {
      await persistMessage(chatId, "ai", reply, true);
    }
    await trackUsage({ provider: activeProvider, organizationId: auth.organizationId, userId: auth.userId });
    return { success: true, text: reply, ...extra };
  };

  // ── Action confirmation ──────────────────────────────────────────
  if (actionConfirm) {
    const { action, payload, confirmed } = actionConfirm;
    if (!confirmed) {
      return await start("The requested action has been cancelled.", {
        toolCalls: [{ name: action, status: "failed" }],
      });
    }
    const resolved = resolveTool(action);
    if (!resolved) {
      return await start(null, {
        success: false,
        error: { code: "NOT_IMPLEMENTED", message: `Tool ${action} is not implemented.` },
      });
    }
    const result = await resolved.handler(auth, payload);
    if (!result?.success) {
      return await start(null, {
        success: false,
        error: result?.error || { code: "ERROR", message: "Action failed." },
      });
    }
    const summary = await summarizeResult({
      text: "",
      data: result.data,
      userMessage: message,
      provider: activeProvider,
    });
    const reply = summary || `Action ${action} completed successfully.`;
    return await start(reply, {
      toolCalls: [{ name: action, status: "completed" }],
      structuredData: result.data,
    });
  }

  // ── Persist user message + build history ─────────────────────────
  if (message && chatId) {
    await persistMessage(chatId, "user", message, false);
  }
  const history = await buildHistory(chatId);

  // ── Intent planning (role-filtered) ──────────────────────────────
  const intent = await extractIntent({
    message,
    role: auth.role,
    scope: auth.scope,
    conversationHistory: history,
    provider: activeProvider,
    model: modelName,
    organizationId: auth.organizationId,
  });

  // ── Clarification / unsupported short-circuit ────────────────────
  if (intent.type === "clarification" || intent.type === "unsupported") {
    return await start(intent.message || "I'm not able to help with that.");
  }

  // ── Find-or-create flow ──────────────────────────────────────────
  const { flow, scope } = await findOrCreateFlow({
    organizationId: auth.organizationId,
    user,
    chatId,
    intent,
    message,
  });

  // Mark the flow as running
  await AgentFlow.updateOne(
    { _id: flow._id },
    { $set: { status: "running", started_at: new Date() } }
  ).catch(() => null);

  // ── Execute steps ────────────────────────────────────────────────
  const toolCalls = [];
  let finalText = "";
  let structuredData = null;
  let stepStore = flow.steps || [];

  const updateStep = async (index, patch) => {
    const update = {};
    Object.entries(patch).forEach(([k, v]) => { update[`steps.${index}.${k}`] = v; });
    await AgentFlow.updateOne(
      { _id: flow._id },
      { ...(Object.keys(update).length ? { $set: update } : {}) }
    ).catch(() => null);
  };

  for (let i = 0; i < stepStore.length; i++) {
    const step = { ...stepStore[i] };
    const outcome = await executeStep({ step, auth, chatId });
    stepStore[i] = outcome.step;
    await updateStep(i, {
      status: outcome.step.status,
      result: outcome.step.result ?? null,
      error: outcome.step.error ?? null,
      started_at: outcome.step.started_at ?? null,
      completed_at: outcome.step.completed_at ?? null,
    });

    if (outcome.pending) {
      await AgentFlow.updateOne(
        { _id: flow._id },
        { $set: { status: "draft" } }
      ).catch(() => null);
      return await start("I need your approval to execute this action.", {
        pendingAction: outcome.pending,
        toolCalls: [{ name: outcome.pending.action, status: "pending" }],
        flowId: flow._id,
      });
    }

    if (outcome.error) {
      await AgentFlow.updateOne(
        { _id: flow._id },
        { $set: { status: "failed", error: outcome.error } }
      ).catch(() => null);
      const toolName = outcome.step?.tool || outcome.step?.action || "AI Copilot";
      return await start(`I encountered an issue while processing your request: ${outcome.error}`, {
        success: false,
        error: { code: "TOOL_ERROR", message: outcome.error },
        toolCalls: [{ name: toolName, status: "failed" }],
        flowId: flow._id,
      });
    }

    toolCalls.push({ name: outcome.step.tool || outcome.step.action, status: "completed" });
    if (outcome.data !== undefined) {
      structuredData = outcome.data;
      finalText = await summarizeResult({
        text: "",
        data: outcome.data,
        userMessage: message,
        provider: activeProvider,
      }) || "";
    }
    if (outcome.text) {
      finalText = outcome.text;
    }
  }

  await AgentFlow.updateOne(
    { _id: flow._id },
    {
      $set: {
        status: "completed",
        completed_at: new Date(),
        result: structuredData ?? finalText,
      },
    }
  ).catch(() => null);

  if (!finalText) {
    const ragMsg = await processAIMessage({
      chatId,
      userId: auth.userId,
      userMessage: message,
      organizationId: auth.organizationId,
      roleName: auth.role,
    });
    finalText = ragMsg?.content || "";
  }

  return await start(finalText, { toolCalls, structuredData, flowId: flow._id, intent: intent.type });
};

export const listFlows = async ({ organizationId, limit = 20, skip = 0, status = null }) => {
  const filter = {};
  if (organizationId) filter.organization_id = organizationId;
  if (status && status !== "all") filter.status = status;
  const [flows, total] = await Promise.all([
    AgentFlow.find(filter)
      .populate("user_id", "name email")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AgentFlow.countDocuments(filter),
  ]);
  return { data: flows, pagination: { total, page: Math.floor(skip / limit) + 1, limit, totalPages: Math.ceil(total / limit) } };
};

export const getModelHealth = async ({ organizationId }) => modelHealth({ organizationId });

export default {
  processAgentMessage,
  listFlows,
  getModelHealth,
};