import mongoose from "mongoose";
import { generateResponse } from "../../modules/llm/index.js";
import { getAuthContext } from "./aiOrchestrator.js";
import * as businessTools from "../business-ai/businessTools.js";
import { searchWithScope } from "../../modules/rag/rag.service.js";
import { retrieveGraphContext } from "../mongodbGraph.service.js";
import Topic from "../../modules/topic/topic.schema.js";

const isWriteOperation = (toolName) => {
  const writeTools = [
    "sendNotification", "createTicket", "updateTicket", "assignTicket",
    "updateDocumentStatus", "createFAQ", "updateFAQ", "createUser",
    "updateUser", "disableUser", "createBranch", "updateBranch",
    "createOrganization", "updateOrganizationStatus",
    "create_refund", "update_refund"
  ];
  return writeTools.includes(toolName);
};

const TOOL_DEFINITIONS = {
  getOrganizationDetails: "getOrganizationDetails() - Retrieves details of the authenticated organization.",
  getOrganizations: "getOrganizations(filters: { status, search }) - Retrieves all organizations on the platform (super_admin only).",
  getPlatformStats: "getPlatformStats() - Retrieves platform-wide analytics and statistics (super_admin only).",
  getAuditLogs: "getAuditLogs(filters: { organizationId, action }) - Retrieves platform audit trails (super_admin only).",
  getBranches: "getBranches() - Retrieves list of branches inside the organization.",
  getUsers: "getUsers(filters: { role, status, branchId }) - Retrieves list of users.",
  getUserDetails: "getUserDetails(userId) - Retrieves details of a specific user.",
  getTickets: "getTickets(filters: { status, priority, branchId }) - Retrieves list of tickets.",
  getTicketDetails: "getTicketDetails(ticketId) - Retrieves details of a support ticket.",
  getDocuments: "getDocuments(filters: { status, branchId, visiblity }) - Retrieves list of documents.",
  getDocumentStatus: "getDocumentStatus(docId) - Retrieves processing status of a document.",
  getNotifications: "getNotifications(filters: { branchId }) - Retrieves notifications sent to users.",
  getFAQs: "getFAQs(filters: { category, isActive }) - Retrieves Frequently Asked Questions.",
  getReports: "getReports() - Retrieves quick branch/org statistics summary.",
  getPendingItems: "getPendingItems() - Retrieves list of pending tickets/documents.",
  sendNotification: "sendNotification(args: { branchId, title, message, type }) - Broadcasts notifications.",
  createTicket: "createTicket(args: { userId, subject, description, priority, category, branchId }) - Creates a support ticket.",
  updateTicket: "updateTicket(args: { ticketId, updates: { status, priority, category, subject, description } }) - Updates ticket status/priority.",
  assignTicket: "assignTicket(args: { ticketId, assignedToId }) - Assigns a ticket to a support representative.",
  updateDocumentStatus: "updateDocumentStatus(args: { docId, status }) - Approves or archives a document.",
  createFAQ: "createFAQ(args: { question, answer, category, is_active }) - Creates an FAQ entry.",
  updateFAQ: "updateFAQ(args: { faqId, updates }) - Edits an FAQ entry.",
  createUser: "createUser(args: { name, email, phone, role, password, branchId }) - Creates a user account.",
  updateUser: "updateUser(args: { targetUserId, updates }) - Edits user profile/status.",
  disableUser: "disableUser(args: { targetUserId }) - Suspends a user account.",
  createBranch: "createBranch(args: { name, code, address, phone, email }) - Registers a branch.",
  updateBranch: "updateBranch(args: { branchId, updates }) - Edits branch contact info.",
  createOrganization: "createOrganization(args: { name, email, code, phone, address, domain }) - Creates a new tenant (super_admin only).",
  updateOrganizationStatus: "updateOrganizationStatus(args: { organizationId, status }) - Suspends or activates a tenant (super_admin only).",
  get_refund: "get_refund(args: { refundId }) - Retrieves details of a refund request.",
  check_refund_eligibility: "check_refund_eligibility(args: { userId }) - Checks if a customer is eligible for a refund.",
  create_refund: "create_refund(args: { userId, subject, description, priority, branchId }) - Submits a refund request.",
  update_refund: "update_refund(args: { refundId, updates: { status, priority, description } }) - Updates an existing refund request."
};

const buildDynamicSystemPrompt = (enabledTools) => {
  const readToolsText = [];
  const actionToolsText = [];

  enabledTools.forEach(tName => {
    const desc = TOOL_DEFINITIONS[tName];
    if (!desc) return;
    
    if (isWriteOperation(tName)) {
      actionToolsText.push(`- ${desc}`);
    } else {
      readToolsText.push(`- ${desc}`);
    }
  });

  return `
You are the Business AI assistant for a customer-support system.
Your job is to understand the user's request and select the correct business tool.
You work only with live application/business data. Do not answer general questions.

AVAILABLE READ-ONLY TOOLS:
${readToolsText.join("\n") || "None"}

AVAILABLE ACTION TOOLS:
${actionToolsText.join("\n") || "None"}

CRITICAL RULES:
1. Output exactly ONE valid JSON object.
2. Do not output markdown, backticks or explanations.
3. If required arguments are missing, return a "clarification" response instead of inventing values.
4. If request does not match an available tool, return "unsupported".

OUTPUT TYPES:
{
  "type": "tool",
  "tool": "toolName",
  "args": { ... }
}
or
{
  "type": "action",
  "tool": "toolName",
  "requiresConfirmation": true,
  "args": { ... }
}
or
{
  "type": "clarification",
  "message": "..."
}
`;
};

// Detect Topic using LLM
export const classifyUserQuestionTopic = async (message, organizationId) => {
  const topics = await Topic.find({ organization_id: organizationId, enabled: true }).lean();
  if (topics.length === 0) return null;

  const topicList = topics.map(t => `- Name: "${t.name}" | Description: "${t.description || ''}"`).join('\n');
  const prompt = `Classify this user request into exactly one of the topics below.
Topics:
${topicList}

User Request: "${message}"

Respond ONLY with the name of the topic. If it matches none of them, respond with "none". Do not add any explanation or quotes.`;

  const llmRes = await generateResponse(prompt, message, {
    provider: "ollama",
    model: "llama3.2:3b",
    organizationId
  });

  const responseText = (llmRes.text || "").trim().replace(/['"]/g, "");
  const matchedTopic = topics.find(t => t.name.toLowerCase() === responseText.toLowerCase());
  return matchedTopic || null;
};

// Primary streaming orchestration function
export const processAIStream = async (req, res) => {
  const { chatId, message, model, actionConfirm } = req.body;
  const user = req.user;
  const auth = getAuthContext(user);
  const orgId = auth.organizationId;

  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendStatus = (statusText) => {
    res.write(`data: ${JSON.stringify({ type: "status", status: statusText })}\n\n`);
  };

  const sendToken = (token) => {
    res.write(`data: ${JSON.stringify({ type: "token", token })}\n\n`);
  };

  const sendError = (errMessage) => {
    res.write(`data: ${JSON.stringify({ type: "error", message: errMessage })}\n\n`);
    res.end();
  };

  try {
    const Message = mongoose.model("Message");

    // Save incoming user message in background
    if (chatId) {
      await Message.create({
        chat_id: chatId,
        sender_id: auth.userId,
        sender_type: "user",
        content: message,
        is_ai: false
      }).catch(() => null);
    }

    sendStatus("Analyzing question");

    // 1. Detect Topic
    const matchedTopic = await classifyUserQuestionTopic(message, orgId);
    let enabledTools = [];

    if (matchedTopic) {
      sendStatus(`Topic: ${matchedTopic.name}`);
      enabledTools = matchedTopic.tools || [];
    } else {
      sendStatus("Topic: General");
    }

    // 2. Load Tools and check if tool should be executed
    let toolResultContext = "";
    let executingToolName = "";
    let executionPending = null;

    if (enabledTools.length > 0) {
      sendStatus("Checking topic capabilities");

      const toolPrompt = `${buildDynamicSystemPrompt(enabledTools)}\n\nUser request: "${message}"\nSelect matching tool or return unsupported:`;
      const toolRes = await generateResponse(toolPrompt, message, {
        provider: "ollama",
        model: "llama3.2:3b",
        organizationId: orgId
      });

      let toolDecision = null;
      try {
        const text = toolRes.text || "";
        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          toolDecision = JSON.parse(text.substring(firstBrace, lastBrace + 1));
        }
      } catch {}

      if (toolDecision && toolDecision.tool && enabledTools.includes(toolDecision.tool)) {
        const toolName = toolDecision.tool;
        const args = toolDecision.args || {};

        if (isWriteOperation(toolName)) {
          // If not confirmed yet, halt stream and ask for confirmation
          if (!actionConfirm || actionConfirm.action !== toolName || !actionConfirm.confirmed) {
            res.write(`data: ${JSON.stringify({
              type: "confirmation",
              pendingAction: {
                action: toolName,
                payload: args,
                preview: {
                  message: `This will trigger the action: "${toolName}" with arguments: ${JSON.stringify(args)}.`
                }
              }
            })}\n\n`);
            res.end();
            return;
          }
        }

        // Execute Tool
        sendStatus(`Running tool: ${toolName}`);
        const toolFunc = businessTools[toolName];
        if (toolFunc) {
          const runResult = await toolFunc(auth, args);
          if (runResult.success) {
            toolResultContext = `\n[Tool Executed Successfully: ${toolName}]\nArguments: ${JSON.stringify(args)}\nResult Data: ${JSON.stringify(runResult.data)}`;
          } else {
            toolResultContext = `\n[Tool Execution Failed: ${toolName}]\nError: ${JSON.stringify(runResult.error)}`;
          }
        }
      }
    }

    // 3. Search Vector Database (ChromaDB)
    sendStatus("Searching knowledge base");
    const accessScope = {
      roleName: auth.role,
      statusFilter: "published",
      authorizedDocumentIds: [],
      branchId: auth.branchIds[0] || null
    };
    
    // Get authorized doc IDs
    const { getAuthorizedDocumentIds } = await import("../../modules/rag/rag.service.js");
    accessScope.authorizedDocumentIds = await getAuthorizedDocumentIds(orgId, auth.role, accessScope.branchId);

    const ragResults = await searchWithScope(message, orgId, accessScope, 5, auth.userId, chatId);

    // 4. Retrieve Graph RAG Context
    sendStatus("Checking graph relationships");
    const graphContext = ragResults.graph_context || "";

    // 5. Combine everything into LLM generation prompt
    sendStatus("Generating response");

    const citations = ragResults.document_results
      .filter((r) => r.score >= 0.35)
      .slice(0, 5)
      .map((r) => ({
        documentId: r.document_id?.toString(),
        title: r.title || "Source Document",
        score: r.score,
        excerpt: r.content?.slice(0, 200)
      }));

    const ragTextContext = ragResults.document_results
      .filter((r) => r.score >= 0.35)
      .slice(0, 5)
      .map((r) => `[Source: ${r.title || "Doc"}] ${r.content}`)
      .join("\n\n");

    const finalPrompt = `You are a supportive customer support AI. Use the retrieved documentation, database entity relations, and tool execution results below to formulate a helpful, direct response to the user.

RETRIEVED DOCUMENTATION CONTEXT:
${ragTextContext || "No documentation found."}

${graphContext ? `RELEVANT GRAPH CONNECTIONS:\n${graphContext}\n` : ""}
${toolResultContext ? `LIVE SYSTEM DATA (TOOL RESULTS):\n${toolResultContext}\n` : ""}
USER QUESTION:
"${message}"

Respond directly and politely. Do not make up facts.`;

    // 6. Connect to Ollama generate streaming endpoint
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2:3b";

    const fetchRes = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: finalPrompt,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 1024
        }
      })
    });

    if (!fetchRes.ok) {
      throw new Error(`Ollama returned status: ${fetchRes.status}`);
    }

    const reader = fetchRes.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const token = parsed.response;
          if (token) {
            fullAnswer += token;
            sendToken(token);
          }
        } catch {}
      }
    }

    // Save generated AI response
    let savedMsgId = null;
    if (chatId) {
      const aiMsg = await Message.create({
        chat_id: chatId,
        sender_id: auth.userId,
        sender_type: "ai",
        content: fullAnswer,
        is_ai: true
      }).catch(() => null);
      savedMsgId = aiMsg?._id;
    }

    // Send final Done state with citations
    res.write(`data: ${JSON.stringify({
      type: "done",
      messageId: savedMsgId,
      text: fullAnswer,
      citations
    })}\n\n`);
    res.end();

  } catch (error) {
    console.error("[StreamingAI] Error in streaming pipeline:", error);
    sendError(error.message);
  }
};
