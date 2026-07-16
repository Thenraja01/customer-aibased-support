import * as kgService from "./knowledgeGraph.service.js";

export const getNodesByDocument = async (req, res) => {
  try {
    const nodes = await kgService.findNodesByDocument(req.params.documentId);
    res.status(200).json({ success: true, data: nodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNodeById = async (req, res) => {
  try {
    const node = await kgService.findNodeById(req.params.id);
    if (!node) return res.status(404).json({ success: false, message: "Node not found" });
    res.status(200).json({ success: true, data: node });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchNodes = async (req, res) => {
  try {
    const nodes = await kgService.findNodesByEntityName(req.query.name || "");
    res.status(200).json({ success: true, data: nodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const traverse = async (req, res) => {
  try {
    const { startNodeId, maxDepth } = req.query;
    if (!startNodeId) {
      return res.status(400).json({ success: false, message: "startNodeId is required" });
    }
    const nodes = await kgService.bfsTraversal(startNodeId, Number(maxDepth) || 2);
    res.status(200).json({ success: true, data: nodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await kgService.getGraphStats(req.params.documentId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
