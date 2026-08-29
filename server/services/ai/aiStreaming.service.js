import mongoose from "mongoose";
import { generateResponse } from "../../modules/llm/index.js";
import { getAuthContext } from "./aiOrchestrator.js";
import { searchWithScope } from "../../modules/rag/rag.service.js";
import { retrieveGraphContext } from "../mongodbGraph.service.js";
import Topic from "../../modules/topic/topic.schema.js";

// Detect Topic using fast keyword matching
export const classifyUserQuestionTopic = async (message, organizationId) => {
  const topics = await Topic.find({ organization_id: organizationId, enabled: true }).lean();
  if (topics.length === 0) return null;

  const lowerMsg = (message || "").toLowerCase();

  // 1. Direct name and configured keyword match
  for (const t of topics) {
    const tName = t.name.toLowerCase();
    if (lowerMsg.includes(tName)) return t;
    if (t.keywords && Array.isArray(t.keywords) && t.keywords.some((k) => lowerMsg.includes(k.toLowerCase()))) {
      return t;
    }
  }

  // 2. Common domain semantics mapping
  if (/return|refund/i.test(lowerMsg)) {
    return topics.find((t) => /return|refund/i.test(t.name)) || null;
  }
  if (/ship|delivery|tracking|courier|dispatch/i.test(lowerMsg)) {
    return topics.find((t) => /shipping|delivery/i.test(t.name)) || null;
  }
  if (/warranty|guarantee|claim/i.test(lowerMsg)) {
    return topics.find((t) => /warranty/i.test(t.name)) || null;
  }
  if (/pay|invoice|bill|charge|card|upi|bank/i.test(lowerMsg)) {
    return topics.find((t) => /billing|payment/i.test(t.name)) || null;
  }
  if (/order|cancel|modify order/i.test(lowerMsg)) {
    return topics.find((t) => /order/i.test(t.name)) || null;
  }
  if (/complaint|grievance|escalat/i.test(lowerMsg)) {
    return topics.find((t) => /complaint|escalat/i.test(t.name)) || null;
  }
  if (/password|2fa|login|auth|security|otp/i.test(lowerMsg)) {
    return topics.find((t) => /security|auth/i.test(t.name)) || null;
  }
  if (/error|troubleshoot|bug|issue|crash/i.test(lowerMsg)) {
    return topics.find((t) => /troubleshoot/i.test(t.name)) || null;
  }

  return null;
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
    const Chat = mongoose.model("Chat");

    // Suppress AI response if chat is in live human handoff mode
    if (chatId) {
      const chatDoc = await Chat.findById(chatId).lean();
      if (chatDoc && (chatDoc.is_escalated || chatDoc.status === "escalated" || chatDoc.status === "in_progress" || chatDoc.status === "HUMAN_ACTIVE" || chatDoc.status === "HUMAN_QUEUED")) {
        const userMsg = await Message.create({
          chat_id: chatId,
          sender_id: auth.userId,
          sender_type: "user",
          content: message,
          is_ai: false
        }).catch(() => null);

        try {
          const { getIO } = await import("./socket.service.js");
          const io = getIO();
          if (io) {
            io.emit("chat:message", { chatId, chat_id: chatId, content: message, is_ai: false, sender_id: auth.userId });
            io.emit("message:new", userMsg);
          }
        } catch {}

        res.write(`data: ${JSON.stringify({ type: "done", text: "", isHumanHandoff: true })}\n\n`);
        return res.end();
      }
    }

    // Save incoming user message in background for standard AI chats
    if (chatId) {
      await Message.create({
        chat_id: chatId,
        sender_id: auth.userId,
        sender_type: "user",
        content: message,
        is_ai: false
      }).catch(() => null);
    }

    // ── 0. Pre-Flight Input Guardrails & Prompt Injection Defense ──
    const { checkInputGuardrails, detectPromptInjection, checkOutputGuardrails } = await import("../../modules/chat/guardrails.service.js");
    const inputCheck = await checkInputGuardrails(message, orgId);
    const injectionCheck = detectPromptInjection(message);

    if (!inputCheck.passed || injectionCheck.isInjected) {
      sendStatus("Safety filter applied");
      const safeFallback = "I'm unable to process this request as it contains restricted or unrecognized instructions. Please ask questions regarding our official products, services, or support policies.";
      sendToken(safeFallback);
      
      const defaultSafetyActions = [
        { label: "Browse Help Center", action: "browse_docs", query: "What topics can you help me with?" },
        { label: "Talk to Support", action: "contact_agent", query: "I want to speak with a human support agent" }
      ];

      res.write(`data: ${JSON.stringify({
        type: "done",
        text: safeFallback,
        confidence: 0,
        citations: [],
        escalation: { available: true, reason: "guardrail_violation" },
        quickActions: defaultSafetyActions
      })}\n\n`);
      return res.end();
    }

    sendStatus("Analyzing question");

    // 1. Detect Topic
    const matchedTopic = await classifyUserQuestionTopic(message, orgId);

    if (matchedTopic) {
      sendStatus(`Topic: ${matchedTopic.name}`);
    } else {
      sendStatus("Topic: General");
    }

    // 3. Search Vector Database & Conversational Context
    sendStatus("Analyzing conversation context");
    const { getConversationContext, updateConversationContext, resolveContextualQuery } = await import("../../modules/chat/conversationContext.service.js");
    const convContext = await getConversationContext(chatId, auth.userId);
    const contextualMessage = resolveContextualQuery(message, convContext);

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

    const ragResults = await searchWithScope(contextualMessage, orgId, accessScope, 5, auth.userId, chatId);

    // 4. Retrieve Relationship-Aware Graph RAG Context
    sendStatus("Checking graph relationships");
    const { retrieveGraphContext } = await import("../mongodbGraph.service.js");
    const graphResults = await retrieveGraphContext(
      contextualMessage,
      orgId,
      accessScope.branchId,
      accessScope.authorizedDocumentIds,
      convContext
    );
    const graphContextText = graphResults.contextText || ragResults.graph_context || "";

    // 5. Combine everything into LLM generation prompt
    sendStatus("Generating response");

    const minScoreThreshold = parseFloat(process.env.LLM_MIN_RAG_SCORE || "0.1");

    const citations = ragResults.document_results
      .filter((r) => r.score >= minScoreThreshold || r.keywordScore >= 0.1 || r.vectorScore >= 0.1)
      .slice(0, 5)
      .map((r) => ({
        documentId: r.document_id?.toString(),
        documentName: r.title || r.file_name || "Source Document",
        title: r.title || r.file_name || "Source Document",
        chunkId: r._id?.toString(),
        chunkIndex: r.chunk_index ?? 0,
        pageNumber: r.page_number || (typeof r.chunk_index === "number" ? r.chunk_index + 1 : 1),
        score: parseFloat((r.score || 0).toFixed(4)),
        relevanceScore: parseFloat((r.score || 0).toFixed(4)),
        excerpt: (r.content || r.text_content || "").slice(0, 500),
        file_url: `/documents/${r.document_id?.toString()}/view`
      }));

    const ragTextContext = ragResults.document_results
      .filter((r) => r.score >= minScoreThreshold || r.keywordScore >= 0.1 || r.vectorScore >= 0.1)
      .slice(0, 5)
      .map((r) => `[Source: ${r.title || "Doc"}] ${r.content}`)
      .join("\n\n");

    const finalPrompt = `You are a friendly, knowledgeable Customer Support Specialist. Formulate a direct, natural, and helpful answer for the customer based on the official company information below.

OFFICIAL COMPANY KNOWLEDGE:
${ragTextContext || "No exact policy or documentation details found."}

${graphContextText ? `RELATED CONTEXT:\n${graphContextText}` : ""}

CUSTOMER QUESTION:
"${contextualMessage}"

CONVERSATIONAL RULES:
1. QUERY FOCUS & INTENT ALIGNMENT: Strictly align your answer with the user's explicit question. For example, if the user asks "Explain about billing", answer about billing options, payment methods, and invoice policies. Do NOT fixate on unrelated sub-bullets in the retrieved text (like bulk discounts or shipping) unless directly requested.
2. OVERVIEW SYNTHESIS: If the user asks a broad topic question (e.g. "Explain about billing"), summarize the available billing & payment info clearly, then ask a helpful follow-up question.
3. NATURAL CUSTOMER SERVICE TONE: Answer directly first in friendly, professional language.
4. NEVER mention internal terms such as "provided document context", "section 4", "retrieved chunks", "RAG", "knowledge graph", or "vector search".
5. ZERO HALLUCINATION: Do NOT hallucinate missing figures, prices, or policies. State what is known naturally.
6. If information is unavailable, politely inform the customer and offer to connect them with a support representative or open a ticket.`;

    const reqProvider = req.body?.provider;
    const reqModel = req.body?.model;

    const llmRes = await generateResponse(finalPrompt, message, {
      organizationId: orgId,
      provider: reqProvider,
      model: reqModel,
    });

    const rawAnswer = typeof llmRes === "string" ? llmRes : llmRes?.text || "No response generated.";

    // ── 6. Output Guardrails & PII Sanitization ──
    const outputGuardrailResult = await checkOutputGuardrails(rawAnswer, orgId);
    const fullAnswer = outputGuardrailResult.sanitized || rawAnswer;

    // Update conversation context buffer
    await updateConversationContext(chatId, auth.userId, message, fullAnswer, "question");
    
    // Stream response tokens to SSE client
    const chunkSize = 12;
    for (let i = 0; i < fullAnswer.length; i += chunkSize) {
      const chunk = fullAnswer.slice(i, i + chunkSize);
      sendToken(chunk);
    }

    // ── 7. Confidence & Dynamic Quick Action Generation ──
    const { computeConfidence } = await import("../../modules/chat/confidence.service.js");
    const confidenceObj = computeConfidence(ragResults, [], message);
    const confidenceScore = confidenceObj?.confidence || (citations.length > 0 ? 0.8 : 0.35);
    const requiresEscalation = confidenceScore < 0.75 || citations.length === 0;

    // Generate contextual Quick Action Buttons
    const quickActions = [];
    const lowerQ = (message || "").toLowerCase();
    if (/order|track|shipping|delivery/i.test(lowerQ)) {
      quickActions.push(
        { label: "Track Order", action: "track_order", query: "How do I track my order delivery?" },
        { label: "Shipping Policy", action: "view_policy", query: "What are your shipping delivery timelines?" }
      );
    } else if (/return|refund/i.test(lowerQ)) {
      quickActions.push(
        { label: "Request Refund", action: "refund_request", query: "How do I request a return or refund?" },
        { label: "Return Policy", action: "view_policy", query: "What is the return window policy?" }
      );
    } else if (/bill|invoice|payment|charge/i.test(lowerQ)) {
      quickActions.push(
        { label: "Download Invoice", action: "download_invoice", query: "How can I download my billing receipts?" },
        { label: "Payment Options", action: "billing_settings", query: "What payment methods are supported?" }
      );
    } else if (/password|login|auth|2fa/i.test(lowerQ)) {
      quickActions.push(
        { label: "Reset Password", action: "reset_password", query: "Send me password reset instructions" },
        { label: "Security Settings", action: "account_security", query: "How do I enable Two-Factor Authentication?" }
      );
    } else {
      quickActions.push(
        { label: "Explore Help Topics", action: "browse_docs", query: "Show available knowledge categories" },
        { label: "Speak to Live Agent", action: "contact_agent", query: "I would like to speak to a human support agent" }
      );
    }

    if (requiresEscalation) {
      quickActions.unshift({
        label: "Create Support Ticket",
        action: "create_ticket",
        query: "Please create a support ticket for this issue"
      });
    }

    // Save generated AI response
    let savedMsgId = null;
    if (chatId) {
      const aiMsg = await Message.create({
        chat_id: chatId,
        sender_id: auth.userId,
        sender_type: "ai",
        content: fullAnswer,
        is_ai: true,
        confidence: confidenceScore,
        citations,
        escalation: {
          available: requiresEscalation,
          reason: requiresEscalation ? "low_confidence_or_missing_info" : "none",
        },
      }).catch(() => null);
      savedMsgId = aiMsg?._id;
    }

    // Send final Done state with structured citations, quick actions & escalation metadata
    res.write(`data: ${JSON.stringify({
      type: "done",
      messageId: savedMsgId,
      text: fullAnswer,
      confidence: confidenceScore,
      citations,
      quickActions,
      escalation: {
        available: requiresEscalation,
        reason: requiresEscalation ? "low_confidence_or_missing_info" : "none",
      }
    })}\n\n`);
    res.end();

  } catch (error) {
    console.error("[StreamingAI] Error in streaming pipeline:", error);
    try {
      const { notifyAdminsOnSystemError } = await import("../../modules/notification/notification.service.js");
      await notifyAdminsOnSystemError({
        organizationId: auth?.orgId || null,
        title: "AI Pipeline Exception",
        message: `AI Chat pipeline error: ${error.message || "Unknown error"}`,
        type: "error",
        link: "/admin/ai-intelligence",
      });
    } catch {
      // notification fallback
    }
    sendError(error.message);
  }
};
