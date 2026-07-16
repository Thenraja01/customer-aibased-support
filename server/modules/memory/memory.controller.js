import * as memoryService from "./memory.service.js";

// POST /memory/store - Store a new long-term memory
export const store = async (req, res) => {
  try {
    const { user_id, chat_id, memory_type, content, keywords, confidence, ttl_days } = req.body;

    if (!user_id || !memory_type || !content) {
      return res.status(400).json({
        success: false,
        message: "user_id, memory_type, and content are required",
      });
    }

    const memory = await memoryService.storeMemory({
      user_id,
      chat_id,
      memory_type,
      content,
      keywords,
      confidence,
      ttl_days,
    });

    res.status(201).json({ success: true, data: memory });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /memory/user/:userId - Get all memories for a user
export const getUserMemories = async (req, res) => {
  try {
    const { memory_type, limit } = req.query;
    const memories = await memoryService.getUserMemories(req.params.userId, {
      memory_type,
      limit: Number(limit) || 50,
    });
    res.status(200).json({ success: true, data: memories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /memory/user/:userId/search?q=... - Search memories by keyword
export const searchByKeyword = async (req, res) => {
  try {
    const keywords = (req.query.q || "")
      .toLowerCase()
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const memories = await memoryService.searchMemoriesByKeyword(
      req.params.userId,
      keywords,
      Number(req.query.limit) || 10
    );

    res.status(200).json({ success: true, data: memories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /memory/user/:userId/relevant?q=... - Get memories relevant to query
export const getRelevant = async (req, res) => {
  try {
    const memories = await memoryService.getRelevantMemories(
      req.params.userId,
      req.query.q || "",
      Number(req.query.limit) || 5
    );
    res.status(200).json({ success: true, data: memories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /memory/user/:userId/stats - Get memory stats
export const getStats = async (req, res) => {
  try {
    const stats = await memoryService.getMemoryStats(req.params.userId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /memory/user/:userId/context - Get full memory context for AI
export const getContext = async (req, res) => {
  try {
    const context = await memoryService.buildFullContext(
      req.params.userId,
      req.query.chat_id,
      req.query.q || ""
    );
    res.status(200).json({
      success: true,
      data: { context, has_context: context.length > 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /memory/user/:userId/extract - Extract facts from chat messages
export const extractFacts = async (req, res) => {
  try {
    const { chat_id, messages } = req.body;

    if (!chat_id || !messages) {
      return res.status(400).json({
        success: false,
        message: "chat_id and messages array are required",
      });
    }

    const memories = await memoryService.extractAndStoreFacts(
      req.params.userId,
      chat_id,
      messages
    );

    res.status(201).json({
      success: true,
      data: {
        extracted: memories.length,
        memories,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// POST /memory/chat/:chatId/short-term/load - Load short-term from DB
export const loadShortTerm = async (req, res) => {
  try {
    const messages = await memoryService.loadShortTermMemory(
      req.params.chatId,
      Number(req.query.limit) || 20
    );
    res.status(200).json({
      success: true,
      data: { messages, count: messages.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /memory/chat/:chatId/short-term - Clear short-term cache
export const clearShortTerm = async (req, res) => {
  try {
    memoryService.clearShortTermMemory(req.params.chatId);
    res.status(200).json({ success: true, message: "Short-term memory cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /memory/:memoryId - Update a memory
export const update = async (req, res) => {
  try {
    const memory = await memoryService.updateMemory(req.params.memoryId, req.body);
    res.status(200).json({ success: true, data: memory });
  } catch (error) {
    const status = error.message === "Memory not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

// DELETE /memory/:memoryId - Delete a memory
export const remove = async (req, res) => {
  try {
    const result = await memoryService.deleteMemory(req.params.memoryId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Memory not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// DELETE /memory/user/:userId - Delete all memories for user
export const removeUserMemories = async (req, res) => {
  try {
    const result = await memoryService.deleteUserMemories(req.params.userId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
