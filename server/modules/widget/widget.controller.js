import Organization from "../organization/organization.schema.js";
import Chat from "../chat/chat.schema.js";
import Message from "../message/message.schema.js";
import { validateApiKey } from "../api-key/apiKey.service.js";
import { processAIMessage } from "../chat/aiChat.service.js";

/**
 * Public widget configuration endpoint.
 * GET /api/v1/widget/config?apiKey=pk_live_...
 */
export const getWidgetConfig = async (req, res, next) => {
  try {
    const rawKey = req.query.apiKey || req.query.key || req.headers["x-api-key"];
    if (!rawKey) {
      return res.status(400).json({ success: false, message: "Widget API Key required" });
    }

    const apiKey = await validateApiKey(rawKey);
    if (!apiKey) {
      return res.status(401).json({ success: false, message: "Invalid or revoked API Key" });
    }

    const org = await Organization.findById(apiKey.organization_id).lean();
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization project not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        organizationId: org._id,
        organizationName: org.name || "Support AI",
        botName: org.chatbot_name || "Support AI",
        greetingMessage: org.greeting_message || "Hello! How can I help you today?",
        position: org.widget_position || "right",
        theme: org.widget_theme || "dark",
        primaryColor: org.brand_colors?.primary || "#2563eb",
        enabled: org.widget_enabled ?? true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start a conversation for embedded widget.
 * POST /api/v1/conversations
 */
export const startConversation = async (req, res, next) => {
  try {
    const rawKey = req.body.apiKey || req.headers["x-api-key"];
    if (!rawKey) {
      return res.status(400).json({ success: false, message: "Widget API Key required" });
    }

    const apiKey = await validateApiKey(rawKey);
    if (!apiKey) {
      return res.status(401).json({ success: false, message: "Invalid or revoked API Key" });
    }

    const { topic = "Embedded Widget Conversation" } = req.body;
    const chat = await Chat.create({
      user_id: apiKey.created_by,
      organization_id: apiKey.organization_id,
      branch_id: apiKey.branch_id || null,
      topic,
      status: "open",
    });

    return res.status(201).json({
      success: true,
      data: {
        chatId: chat._id,
        topic: chat.topic,
        status: chat.status,
        createdAt: chat.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversation history.
 * GET /api/v1/conversations/:id
 */
export const getConversationHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rawKey = req.query.apiKey || req.headers["x-api-key"];
    if (!rawKey) {
      return res.status(400).json({ success: false, message: "Widget API Key required" });
    }

    const apiKey = await validateApiKey(rawKey);
    if (!apiKey) {
      return res.status(401).json({ success: false, message: "Invalid or revoked API Key" });
    }

    const chat = await Chat.findOne({ _id: id, organization_id: apiKey.organization_id }).lean();
    if (!chat) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const messages = await Message.find({ chat_id: id }).sort({ created_at: 1 }).lean();
    return res.status(200).json({
      success: true,
      data: {
        chatId: chat._id,
        messages: messages.map((m) => ({
          id: m._id,
          content: m.content,
          isAI: m.is_ai,
          citations: m.citations || [],
          createdAt: m.created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send widget message & run Hybrid RAG pipeline.
 * POST /api/v1/chat/message
 */
export const sendWidgetMessage = async (req, res, next) => {
  try {
    const { message, chatId, orgId, tenantId, branchId, userId } = req.body;
    const rawKey = req.body.apiKey || req.headers["x-api-key"];
    if (!rawKey) {
      return res.status(400).json({ success: false, message: "Widget API Key required" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required" });
    }

    const apiKey = await validateApiKey(rawKey);
    if (!apiKey) {
      return res.status(401).json({ success: false, message: "Invalid or revoked API Key" });
    }

    const effectiveOrgId = req.headers["x-tenant-id"] || req.headers["x-org-id"] || orgId || tenantId || apiKey.organization_id;
    const effectiveUserId = req.headers["x-user-id"] || userId || apiKey.created_by;
    const effectiveBranchId = req.headers["x-branch-id"] || branchId || apiKey.branch_id;

    let activeChat = null;
    if (chatId) {
      activeChat = await Chat.findOne({ _id: chatId, organization_id: effectiveOrgId });
    }
    if (!activeChat) {
      activeChat = await Chat.create({
        user_id: effectiveUserId,
        organization_id: effectiveOrgId,
        branch_id: effectiveBranchId || null,
        topic: message.substring(0, 50),
        status: "open",
      });
    }

    // Run Hybrid Graph RAG Query (processAIMessage automatically persists user & AI messages)
    const aiResult = await processAIMessage({
      chatId: activeChat._id,
      chat_id: activeChat._id,
      userMessage: message,
      content: message,
      userId: effectiveUserId,
      user_id: effectiveUserId,
      organizationId: effectiveOrgId,
      organization_id: effectiveOrgId,
      branchId: effectiveBranchId,
      branch_id: effectiveBranchId,
    });

    const structuredCitations = (aiResult?.citations || []).map((c) => ({
      documentId: c.documentId || c._id,
      documentName: c.title || c.document_name || "Document.pdf",
      excerpt: c.excerpt || c.text,
    }));

    const answerText =
      aiResult?.is_escalated || aiResult?.suppressedAI
        ? "⚡ You are currently connected to live human support. A support agent will respond to your message shortly."
        : typeof aiResult === "string"
        ? aiResult
        : aiResult?.content ||
          aiResult?.response ||
          aiResult?.text ||
          aiResult?.message?.content ||
          "I am here to assist you.";

    return res.status(200).json({
      success: true,
      data: {
        chatId: activeChat._id,
        messageId: aiResult?._id || aiResult?.message?._id,
        answer: answerText,
        citations: structuredCitations,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Escalate embedded widget chat to human support agent.
 * POST /api/v1/chat/escalate
 */
export const escalateWidgetChat = async (req, res, next) => {
  try {
    const { chatId } = req.body;
    const rawKey = req.body.apiKey || req.headers["x-api-key"];
    if (!rawKey) {
      return res.status(400).json({ success: false, message: "Widget API Key required" });
    }

    const apiKey = await validateApiKey(rawKey);
    if (!apiKey) {
      return res.status(401).json({ success: false, message: "Invalid or revoked API Key" });
    }

    if (!chatId) {
      return res.status(400).json({ success: false, message: "chatId is required" });
    }

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, organization_id: apiKey.organization_id },
      { status: "escalated", is_escalated: true },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }

    // Broadcast escalation event to support agents
    try {
      const { getIO } = await import("../../services/socket.service.js");
      const io = getIO();
      if (io) {
        io.emit("chat:escalated", { chatId: chat._id, topic: chat.topic, organizationId: chat.organization_id });
      }
    } catch {
      /* ignore socket error */
    }

    return res.status(200).json({
      success: true,
      message: "Chat session escalated to live human support.",
      data: { chatId: chat._id, status: chat.status },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get message history for embedded widget chat.
 * GET /api/v1/chat/messages
 */
export const getWidgetMessages = async (req, res, next) => {
  try {
    const rawKey = req.query.apiKey || req.headers["x-api-key"];
    const chatId = req.query.chatId;
    if (!rawKey || !chatId) {
      return res.status(400).json({ success: false, message: "apiKey and chatId are required" });
    }

    const apiKey = await validateApiKey(rawKey);
    if (!apiKey) {
      return res.status(401).json({ success: false, message: "Invalid or revoked API Key" });
    }

    const messages = await Message.find({ chat_id: chatId }).sort({ created_at: 1 }).lean();
    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

/**
 * Handshake and Configuration (/api/v1/widget/init)
 * POST or GET /api/v1/widget/init
 */
export const initWidget = async (req, res, next) => {
  try {
    const rawKey = req.headers["x-api-key"] || req.body?.apiKey || req.query?.apiKey;
    if (!rawKey) {
      return res.status(400).json({ success: false, message: "x-api-key header or apiKey is required" });
    }

    const apiKey = await validateApiKey(rawKey);
    if (!apiKey) {
      return res.status(401).json({ success: false, message: "Invalid or revoked API Key" });
    }

    const org = await Organization.findById(apiKey.organization_id).lean();
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization project not found" });
    }

    // Origin Domain Validation (CORS protection)
    const origin = req.headers.origin || req.headers.referer || "";
    if (org.allowed_domains && org.allowed_domains.length > 0) {
      const isAllowed = org.allowed_domains.some((d) => origin.includes(d));
      if (!isAllowed && origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return res.status(403).json({ success: false, message: `Domain origin '${origin}' not authorized for project` });
      }
    }

    // Reuse or create sessionId
    let chat = null;
    if (req.body?.sessionId) {
      chat = await Chat.findOne({ _id: req.body.sessionId, organization_id: org._id });
    }

    if (!chat) {
      chat = await Chat.create({
        user_id: apiKey.created_by,
        organization_id: org._id,
        branch_id: apiKey.branch_id || null,
        topic: "Embedded Widget Session",
        status: "open",
      });
    }

    return res.status(200).json({
      success: true,
      projectId: org._id,
      botName: org.chatbot_name || org.name || "Supernova AI",
      greeting: org.greeting_message || "Hi! How can we help you today?",
      accentColor: org.brand_colors?.primary || "#6366F1",
      features: {
        fileUploads: true,
        voiceInput: false,
        liveAgentHandoff: true,
      },
      sessionId: chat._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SSE Token Streaming Gateway (/api/v1/chat/stream)
 * POST /api/v1/chat/stream
 */
export const streamWidgetChat = async (req, res, next) => {
  try {
    const rawKey = req.headers["x-api-key"] || req.body?.apiKey;
    const { sessionId, chatId, prompt, message } = req.body;
    const userPrompt = prompt || message;
    const targetChatId = sessionId || chatId;

    if (!rawKey) {
      return res.status(400).json({ success: false, message: "API Key required" });
    }
    if (!userPrompt || !userPrompt.trim()) {
      return res.status(400).json({ success: false, message: "Prompt/message content is required" });
    }

    const apiKey = await validateApiKey(rawKey);
    if (!apiKey) {
      return res.status(401).json({ success: false, message: "Invalid API Key" });
    }

    const effectiveOrgId = req.headers["x-tenant-id"] || req.headers["x-org-id"] || req.body?.orgId || req.body?.tenantId || apiKey.organization_id;
    const effectiveUserId = req.headers["x-user-id"] || req.body?.userId || apiKey.created_by;
    const effectiveRoleName = req.headers["x-user-role"] || req.headers["x-role"] || req.body?.roleName || req.body?.role || "customer";
    const effectiveBranchId = req.headers["x-branch-id"] || req.body?.branchId || apiKey.branch_id;

    let chat = null;
    if (targetChatId) {
      chat = await Chat.findOne({ _id: targetChatId, organization_id: effectiveOrgId });
    }
    if (!chat) {
      chat = await Chat.create({
        user_id: effectiveUserId,
        organization_id: effectiveOrgId,
        branch_id: effectiveBranchId || null,
        topic: userPrompt.substring(0, 50),
        status: "open",
      });
    }

    // Set Server-Sent Events headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Run Hybrid Graph RAG Query (processAIMessage handles user & AI message persistence)
    const aiResult = await processAIMessage({
      chatId: chat._id,
      chat_id: chat._id,
      userMessage: userPrompt,
      content: userPrompt,
      userId: effectiveUserId,
      user_id: effectiveUserId,
      roleName: effectiveRoleName,
      role_name: effectiveRoleName,
      role: effectiveRoleName,
      organizationId: effectiveOrgId,
      organization_id: effectiveOrgId,
      branchId: effectiveBranchId,
      branch_id: effectiveBranchId,
    });

    const structuredCitations = (aiResult?.citations || []).map((c) => ({
      title: c.title || c.document_name || "Knowledge Source",
      url: c.url || `/documents/${c.documentId || c._id}`,
      excerpt: c.excerpt || c.text,
    }));

    // Event 1: metadata (citations & sources)
    sendEvent("metadata", { sources: structuredCitations });

    // Event 2: token stream chunks
    const responseText =
      aiResult?.is_escalated || aiResult?.suppressedAI
        ? "⚡ You are currently connected to live human support. A support agent will respond to your message shortly."
        : typeof aiResult === "string"
        ? aiResult
        : aiResult?.content ||
          aiResult?.response ||
          aiResult?.text ||
          aiResult?.message?.content ||
          "I am here to assist you.";

    const tokens = responseText.split(/(?<=\s)/);
    for (const tok of tokens) {
      sendEvent("token", { text: tok });
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    // Event 3: done
    const confidence = aiResult?.confidence ?? 0.94;
    sendEvent("done", { confidence, conversationId: chat._id });
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
      res.end();
    }
  }
};

/**
 * Multipart file upload for widget (/api/v1/chat/upload)
 * POST /api/v1/chat/upload
 */
export const uploadWidgetFile = async (req, res, next) => {
  try {
    const rawKey = req.headers["x-api-key"] || req.body?.apiKey;
    const { sessionId, chatId } = req.body;
    const targetChatId = sessionId || chatId;

    if (!rawKey) {
      return res.status(400).json({ success: false, message: "API Key required" });
    }

    const apiKey = await validateApiKey(rawKey);
    if (!apiKey) {
      return res.status(401).json({ success: false, message: "Invalid API Key" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    let chat = null;
    if (targetChatId) {
      chat = await Chat.findOne({ _id: targetChatId, organization_id: apiKey.organization_id });
    }
    if (!chat) {
      chat = await Chat.create({
        user_id: apiKey.created_by,
        organization_id: apiKey.organization_id,
        branch_id: apiKey.branch_id || null,
        topic: `File Upload: ${req.file.originalname}`,
        status: "open",
      });
    }

    const fileUrl = req.file.path || `/uploads/${req.file.filename}`;

    const msg = await Message.create({
      chat_id: chat._id,
      sender_id: apiKey.created_by,
      organization_id: apiKey.organization_id,
      content: `[Uploaded Attachment: ${req.file.originalname}](${fileUrl})`,
      is_ai: false,
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        chatId: chat._id,
        messageId: msg._id,
        fileUrl,
        filename: req.file.originalname,
      },
    });
  } catch (error) {
    next(error);
  }
};

