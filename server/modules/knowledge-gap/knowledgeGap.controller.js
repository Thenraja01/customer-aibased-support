import * as knowledgeGapService from "./knowledgeGap.service.js";
import { normalizeRoleName, isNormalizedAdminRole } from "../../utils/constants.js";

export const getKnowledgeGaps = async (req, res) => {
  try {
    const { page, limit, status, topic, search, sortBy, sortOrder } = req.query;
    const isSuperAdmin = isNormalizedAdminRole(normalizeRoleName(req.user?.roleName));
    const orgId = isSuperAdmin ? (req.query.organizationId || req.user?.organizationId) : req.user?.organizationId;
    const result = await knowledgeGapService.getKnowledgeGaps(orgId, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
      topic,
      search,
      sortBy,
      sortOrder,
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGapStats = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";
    const orgId = isSuperAdmin ? (req.query.organizationId || req.user?.organizationId) : req.user?.organizationId;
    const stats = await knowledgeGapService.getGapStats(orgId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGapStatus = async (req, res) => {
  try {
    const { status, resolutionNote } = req.body;
    const gap = await knowledgeGapService.updateGapStatus(
      req.params.id,
      status,
      resolutionNote || "",
      req.user?._id
    );
    res.status(200).json({ success: true, data: gap });
  } catch (error) {
    const status = error.message === "Knowledge gap not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const resolveGap = async (req, res) => {
  try {
    const { note } = req.body;
    const gap = await knowledgeGapService.resolveGap(req.params.id, note || "", req.user?._id);
    res.status(200).json({ success: true, data: gap });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getGapById = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";
    const orgId = isSuperAdmin ? (req.query.organizationId || req.user?.organizationId) : req.user?.organizationId;
    const gap = await knowledgeGapService.getGapDetail(req.params.id, orgId);
    res.status(200).json({ success: true, data: gap });
  } catch (error) {
    const status = error.message === "Knowledge gap not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getSuggestedKnowledge = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";
    const orgId = isSuperAdmin ? (req.query.organizationId || req.user?.organizationId) : req.user?.organizationId;
    const suggestions = await knowledgeGapService.getSuggestedKnowledge(req.params.id, orgId);
    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSimilarGaps = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";
    const orgId = isSuperAdmin ? (req.query.organizationId || req.user?.organizationId) : req.user?.organizationId;
    const similar = await knowledgeGapService.getSimilarGaps(req.params.id, orgId);
    res.status(200).json({ success: true, data: similar });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resolveWithFaq = async (req, res) => {
  try {
    const { question, answer, category } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: "Question and answer are required" });
    }
    const faq = await knowledgeGapService.addKnowledgeFaq(
      req.params.id,
      { question, answer, category: category || "general" },
      req
    );
    res.status(201).json({ success: true, data: faq });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resolveWithDocument = async (req, res) => {
  try {
    const { title, description, content, branchId, tags, allowedRoles, visibility } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required" });
    }
    const doc = await knowledgeGapService.addKnowledgeDocument(
      req.params.id,
      { title, description: description || "", content, branchId, tags, allowedRoles, visibility },
      req
    );
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resolveWithLink = async (req, res) => {
  try {
    const { type, refId } = req.body;
    if (!type || !refId) {
      return res.status(400).json({ success: false, message: "type and refId are required" });
    }
    const result = await knowledgeGapService.linkExistingKnowledge(req.params.id, { type, refId }, req);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const retestGap = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";
    const orgId = isSuperAdmin ? (req.query.organizationId || req.user?.organizationId) : req.user?.organizationId;
    const result = await knowledgeGapService.retestGap(req.params.id, orgId, req.user?.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const generateAIDraft = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";
    const orgId = isSuperAdmin ? (req.query.organizationId || req.user?.organizationId) : req.user?.organizationId;
    const type = req.query.type || "document";
    const draft = await knowledgeGapService.generateAIGapDraft(req.params.id, orgId, type);
    res.status(200).json({ success: true, data: draft });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const dismissGap = async (req, res) => {
  try {
    const gap = await knowledgeGapService.dismissGap(req.params.id, req.user?._id);
    res.status(200).json({ success: true, data: gap });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteGap = async (req, res) => {
  try {
    const result = await knowledgeGapService.deleteGap(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSuggestedTopics = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";
    const orgId = isSuperAdmin ? (req.query.organizationId || req.user?.organizationId) : req.user?.organizationId;
    const topics = await knowledgeGapService.getSuggestedTopics(orgId);
    res.status(200).json({ success: true, data: topics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};