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