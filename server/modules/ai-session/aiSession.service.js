import AIConversation from "./aiConversation.schema.js";
import AIMessage from "./aiMessage.schema.js";
import AIAction from "./aiAction.schema.js";
import { generateResponse } from "../llm/index.js";
import * as auditLogService from "../audit-log/auditLog.service.js";

// Helper to determine risk level of a tool
export function getToolRiskLevel(toolName) {
  if (!toolName) return "LOW";
  const name = String(toolName).toLowerCase();

  if (name.includes("delete.org") || name.includes("delete.branch") || name.includes("purge")) {
    return "CRITICAL";
  }
  if (name.includes("delete") || name.includes("broadcast") || name.includes("config") || name.includes("disable")) {
    return "HIGH";
  }
  if (name.includes("create") || name.includes("assign") || name.includes("update") || name.includes("status")) {
    return "MEDIUM";
  }
  return "LOW";
}

export async function getSessionStats(orgId, branchId) {
  const query = {};
  if (orgId) query.organization_id = orgId;
  if (branchId) query.branch_id = branchId;

  const totalSessions = await AIConversation.countDocuments(query);
  const totalMessages = await AIMessage.countDocuments(query);
  const pendingActions = await AIAction.countDocuments({ ...query, status: "PENDING_CONFIRMATION" });

  return {
    totalSessions,
    totalMessages,
    pendingActions,
  };
}

// Conversation Services
export async function getConversations(userId, orgId, branchId) {
  const query = { user_id: userId, organization_id: orgId, is_archived: false };
  if (branchId) query.branch_id = branchId;
  return await AIConversation.find(query).sort({ is_pinned: -1, updated_at: -1 }).lean();
}

export async function createConversation({ userId, orgId, branchId, title, mode, model }) {
  const conv = new AIConversation({
    user_id: userId,
    organization_id: orgId,
    branch_id: branchId || null,
    title: title || "New AI Workspace Conversation",
    mode: mode || "ask_ai",
    model: model || "ollama",
  });
  return await conv.save();
}

export async function updateConversation(convId, userId, updates) {
  const conv = await AIConversation.findOne({ _id: convId, user_id: userId });
  if (!conv) throw new Error("Conversation not found");
  if (updates.title !== undefined) conv.title = updates.title;
  if (updates.is_pinned !== undefined) conv.is_pinned = updates.is_pinned;
  if (updates.is_archived !== undefined) conv.is_archived = updates.is_archived;
  if (updates.mode !== undefined) conv.mode = updates.mode;
  if (updates.model !== undefined) conv.model = updates.model;
  return await conv.save();
}

export async function deleteConversation(convId, userId) {
  await AIMessage.deleteMany({ conversation_id: convId });
  return await AIConversation.deleteOne({ _id: convId, user_id: userId });
}

export async function getMessages(convId, userId) {
  return await AIMessage.find({ conversation_id: convId }).sort({ created_at: 1 }).lean();
}

export async function setMessageFeedback(messageId, userId, feedback) {
  const msg = await AIMessage.findById(messageId);
  if (!msg) throw new Error("Message not found");
  msg.feedback = feedback;
  return await msg.save();
}

// Action Confirmation Services
export async function confirmAction(actionId, user) {
  const action = await AIAction.findById(actionId);
  if (!action) throw new Error("Action not found");

  if (action.status === "EXECUTED") {
    return { success: true, already_executed: true, result: action.result };
  }

  if (action.status === "EXPIRED" || new Date() > new Date(action.expires_at)) {
    action.status = "EXPIRED";
    await action.save();
    throw new Error("Action confirmation has expired (5 minute TTL)");
  }

  if (action.user_id.toString() !== (user.userId || user._id).toString()) {
    throw new Error("Unauthorized to confirm this action");
  }

  // Execute business tool via toolRuntime service
  const auth = {
    userId: user.userId || user._id,
    organizationId: action.organization_id,
    branchId: action.branch_id,
    roleName: user.roleName || user.role,
  };
  const execRes = await executeToolByIdOrName(action.tool_name, auth, action.arguments);

  action.status = "EXECUTED";
  action.result = execRes;
  action.executed_at = new Date();
  await action.save();

  // Log to Audit Log
  await auditLogService.createAuditLog({
    user_id: user.userId || user._id,
    role: user.roleName || user.role,
    organization_id: action.organization_id,
    branch_id: action.branch_id,
    action: `AI_TOOL_CONFIRMED:${action.tool_name}`,
    details: { actionId, risk: action.risk_level, result: execRes },
  });

  return { success: true, result: execRes };
}

export async function cancelAction(actionId, user) {
  const action = await AIAction.findById(actionId);
  if (!action) throw new Error("Action not found");
  action.status = "CANCELLED";
  await action.save();
  return { success: true, message: "Action cancelled" };
}

// Main AI Stream Handler (Supports RAG, Business Tools, Risk Confirmation, SSE Streaming)
export async function processAIStreamRequest({
  conversationId,
  userPrompt,
  mode = "ask_ai",
  model = "ollama",
  user,
  onToken,
  onEvent,
}) {
  const userId = user.userId || user._id;
  const orgId = user.organizationId || user.organization_id;
  const branchId = user.branchId || user.branch_id || null;
  const userRole = user.roleName || user.role || "customer";

  // 1. Save User Message
  let conversation = null;
  if (conversationId) {
    conversation = await AIConversation.findOne({ _id: conversationId, user_id: userId });
  }

  if (!conversation) {
    conversation = await createConversation({
      userId,
      orgId,
      branchId,
      title: userPrompt.slice(0, 40) + "...",
      mode,
      model,
    });
  }

  const userMsg = new AIMessage({
    conversation_id: conversation._id,
    user_id: userId,
    role: "user",
    content: userPrompt,
  });
  await userMsg.save();

  onEvent("start", { conversation_id: conversation._id, user_message_id: userMsg._id });

  // 2. RAG Retrieval if Mode requires knowledge
  let sources = [];
  let ragContextText = "";
  if (mode === "knowledge" || mode === "documents" || mode === "ask_ai") {
    try {
      const ragResults = await searchWithScope(userPrompt, orgId, userRole, branchId);
      const docs = ragResults?.documents || ragResults?.results || (Array.isArray(ragResults) ? ragResults : []);
      if (docs && docs.length > 0) {
        sources = docs.map((d, idx) => ({
          id: d._id || `doc-${idx}`,
          title: d.title || "Knowledge Document",
          type: "document",
          chunk_id: d.chunk_id,
          document_id: d._id,
          relevance: Math.round((d.score || 0.85) * 100),
          entities: d.entities || [],
        }));

        ragContextText = ragResults.documents
          .map((d) => `Document "${d.title}": ${d.content || d.snippet || ""}`)
          .join("\n\n");

        for (const s of sources) {
          onEvent("source", s);
        }
      }
    } catch {
      // Gracefully continue if RAG retrieval returns empty
    }
  }

  // 3. System Prompt Customization by Role & Stack Directives
  const systemPrompt = `You are SupportAI Assistant for an Enterprise Multi-Tenant Customer Support Platform.
User Role: ${userRole}
Organization ID: ${orgId}
Branch ID: ${branchId || "N/A"}
Mode: ${mode}

CRITICAL ARCHITECTURE RULES:
- THIS PLATFORM USES THE MERN STACK (MongoDB, Express.js, React.js, Node.js, Mongoose).
- Always use MongoDB Mongoose models (Ticket, Organization, Branch, User, Document) and MongoDB Aggregation Pipelines ($match, $group, $lookup, $project) for database queries or code snippets.
- Respond in clear, professional GitHub-flavored markdown with structured tables and actionable bullet points.

${ragContextText ? `Retrieved Knowledge Base Context:\n${ragContextText}\n` : ""}
Provide clear, accurate, helpful, markdown-formatted responses. Highlight action items clearly.`;

  // 4. LLM Stream Generation
  const fullPrompt = `${systemPrompt}\n\nUser Question: ${userPrompt}`;
  const response = await generateResponse(fullPrompt, userPrompt, {
    provider: model || "ollama",
    organizationId: orgId,
  });

  const responseText = response?.text || "I have processed your request.";

  // Emit tokens (simulated SSE token chunks for smooth UX)
  const words = responseText.split(" ");
  for (let i = 0; i < words.length; i++) {
    const chunk = (i === 0 ? "" : " ") + words[i];
    onToken(chunk);
  }

  // 5. Save Assistant Response
  const assistantMsg = new AIMessage({
    conversation_id: conversation._id,
    user_id: userId,
    role: "assistant",
    content: responseText,
    sources,
  });
  await assistantMsg.save();

  onEvent("done", {
    message_id: assistantMsg._id,
    conversation_id: conversation._id,
    usage: { tokens: words.length },
  });

  return { conversationId: conversation._id, assistantMessageId: assistantMsg._id };
}
