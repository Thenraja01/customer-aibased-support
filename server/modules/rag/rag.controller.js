import * as ragService from "./rag.service.js";
import * as kgService from "../knowledge-graph/knowledgeGraph.service.js";
import * as chunkService from "../document/documentChunk.service.js";

export const ingest = async (req, res) => {
  try {
    const { documentId, text } = req.body;
    const chunks = await ragService.ingestDocument(documentId, text);
    res.status(201).json({ success: true, data: { chunks: chunks.length } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const query = async (req, res) => {
  try {
    const { query: q, documentId, chatId } = req.body;
    const userId = req.user?.userId || req.user?.id || req.body.userId;
    const results = await ragService.hybridQuery(q, documentId, 5, userId, chatId);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeDocumentData = async (req, res) => {
  try {
    const result = await ragService.deleteDocumentData(req.params.documentId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await ragService.getRAGStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGlobalStats = async (req, res) => {
  try {
    const graphStats = await kgService.getGraphStats();
    res.status(200).json({ success: true, data: graphStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDocumentGraph = async (req, res) => {
  try {
    const nodes = await kgService.findNodesByDocument(req.params.documentId);
    res.status(200).json({ success: true, data: nodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDocumentChunks = async (req, res) => {
  try {
    const chunks = await chunkService.getChunksByDocument(req.params.documentId);
    res.status(200).json({ success: true, data: chunks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchByKeyword = async (req, res) => {
  try {
    const keywords = req.query.keywords?.split(",") || [];
    const chunks = await chunkService.findByKeywords(keywords, req.query.documentId);
    res.status(200).json({ success: true, data: chunks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
