import * as ragService from "./rag.service.js";
import * as chunkService from "../document/documentChunk.service.js";
import { invalidateOrgResponseCache } from "../../services/promptCache.service.js";

export const ingest = async (req, res) => {
  try {
    const { documentId, text, assigned_role } = req.body;
    const organizationId = req.scope?.organizationId || req.user?.organization_id?._id || req.user?.organizationId;
    const branchId = req.scope?.branchId || null;
    const visibility = req.body.visibility || "branch";
    const customerVisible = req.body.customerVisible || false;
    const allowedRoles = req.body.allowedRoles || ["branch_admin", "support"];

    const chunks = await ragService.ingestDocument(
      documentId,
      organizationId,
      branchId,
      assigned_role || "all",
      text,
      "pending",
      visibility,
      customerVisible,
      allowedRoles
    );
    // Invalidate response cache — new knowledge has been added
    await invalidateOrgResponseCache(organizationId).catch(() => null);
    res.status(201).json({ success: true, data: { chunks: chunks.length } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const query = async (req, res) => {
  try {
    const { query: q, documentId, chatId } = req.body;
    // Identity/context always derives from the authenticated session — never
    // from client-supplied body fields (prevents cross-tenant memory access).
    const userId = req.scope?.userId || req.user?.userId || req.user?.id || null;
    const organizationId = req.scope?.organizationId || req.user?.organization_id?._id || req.user?.organizationId;
    const branchId = req.scope?.isOrgAdmin || req.scope?.isSuperAdmin ? null : req.scope?.branchId;
    const roleName = req.scope?.role || req.user?.roleName;
    const roleId = req.user?.roleId || null;
    const customerVisible = req.scope?.isCustomer ? true : null;

    const results = await ragService.hybridQuery(
      q,
      organizationId,
      documentId,
      5,
      userId,
      chatId,
      roleName,
      roleId,
      branchId,
      customerVisible
    );
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeDocumentData = async (req, res) => {
  try {
    const organizationId = req.user?.organization_id?._id || req.user?.organizationId;
    const result = await ragService.deleteDocumentData(req.params.documentId);
    // Invalidate response cache — knowledge has been removed
    await invalidateOrgResponseCache(organizationId).catch(() => null);
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
