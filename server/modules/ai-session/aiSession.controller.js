import * as sessionService from "./aiSession.service.js";

// GET /api/ai/stats or /ai-sessions/stats
export const getStats = async (req, res) => {
  try {
    const rawOrgId = req.user?.organizationId || req.user?.organization_id;
    const orgId = typeof rawOrgId === "object" && rawOrgId?._id ? rawOrgId._id : rawOrgId;
    const rawBranchId = req.user?.branchId || req.user?.branch_id;
    const branchId = typeof rawBranchId === "object" && rawBranchId?._id ? rawBranchId._id : rawBranchId || null;
    const stats = await sessionService.getSessionStats(orgId, branchId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/ai/conversations
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const orgId = req.user.organizationId || req.user.organization_id;
    const branchId = req.user.branchId || req.user.branch_id || null;
    const conversations = await sessionService.getConversations(userId, orgId, branchId);
    res.json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ai/conversations
export const createConversation = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const orgId = req.user.organizationId || req.user.organization_id;
    const branchId = req.user.branchId || req.user.branch_id || null;

    const conv = await sessionService.createConversation({
      userId,
      orgId,
      branchId,
      title: req.body.title,
      mode: req.body.mode,
      model: req.body.model,
    });
    res.status(201).json({ success: true, data: conv });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /api/ai/conversations/:id/messages
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const messages = await sessionService.getMessages(req.params.id, userId);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/ai/conversations/:id
export const updateConversation = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const conv = await sessionService.updateConversation(req.params.id, userId, req.body);
    res.json({ success: true, data: conv });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/ai/conversations/:id
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    await sessionService.deleteConversation(req.params.id, userId);
    res.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/ai/messages/:id/feedback
export const setFeedback = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const msg = await sessionService.setMessageFeedback(req.params.id, userId, req.body.feedback);
    res.json({ success: true, data: msg });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/ai/actions/:id/confirm
export const confirmAction = async (req, res) => {
  try {
    const result = await sessionService.confirmAction(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/ai/actions/:id/cancel
export const cancelAction = async (req, res) => {
  try {
    const result = await sessionService.cancelAction(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /api/ai/stream (Server-Sent Events streaming endpoint)
export const streamAI = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { conversation_id, message, mode, model } = req.body;

    await sessionService.processAIStreamRequest({
      conversationId: conversation_id,
      userPrompt: message,
      mode: mode || "ask_ai",
      model: model || "ollama",
      user: req.user,
      onToken: (text) => sendEvent("token", { content: text }),
      onEvent: (event, payload) => sendEvent(event, payload),
    });

    res.end();
  } catch (error) {
    sendEvent("error", { message: error.message || "Streaming request failed" });
    res.end();
  }
};
