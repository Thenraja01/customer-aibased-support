import * as quickActionService from "./quickAction.service.js";
import * as knowledgeGraphService from "./knowledgeGraph.service.js";

/**
 * GET /chats/quick-actions
 * Fetch dynamic chatbot quick-action buttons based on authorized published knowledge
 */
export const getQuickActions = async (req, res) => {
  try {
    const quickActions = await quickActionService.getQuickActions(req.user);
    res.status(200).json({ success: true, quickActions });
  } catch (err) {
    console.error("[QuickActionController] getQuickActions failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-graph/search
 * Search entity concept nodes in the Knowledge Graph
 */
export const searchGraphNodes = async (req, res) => {
  try {
    const queryText = req.query.name || req.query.entity_name || "";
    const data = await knowledgeGraphService.searchGraph(queryText);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[QuickActionController] searchGraphNodes failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /admin/v1/knowledge-graph-stats
 * Get overall node and edge stats for Knowledge Graph telemetry
 */
export const getGraphStats = async (req, res) => {
  try {
    const data = await knowledgeGraphService.getGraphStats();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[QuickActionController] getGraphStats failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
