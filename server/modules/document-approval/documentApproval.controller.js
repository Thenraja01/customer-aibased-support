import * as approvalService from "./documentApproval.service.js";

export const submitApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user._id;
    const orgId = req.user.organizationId;
    const branchId = req.user.branchId;

    const result = await approvalService.submitForApproval(id, userId, orgId, branchId);
    res.status(200).json({ success: true, message: "Document submitted for approval", data: result });
  } catch (error) {
    const status = error.message.includes("Forbidden") ? 403 : error.message.includes("not found") ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId || req.user._id;
    const orgId = req.user.organizationId;
    const branchId = req.user.branchId;

    const doc = await approvalService.approveDocument(id, userId, orgId, branchId, comment);
    res.status(200).json({ success: true, message: "Document approved", data: doc });
  } catch (error) {
    const status = error.message.includes("Forbidden") ? 403 : error.message.includes("not found") ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId || req.user._id;
    const orgId = req.user.organizationId;
    const branchId = req.user.branchId;

    const doc = await approvalService.rejectDocument(id, userId, orgId, branchId, comment);
    res.status(200).json({ success: true, message: "Document rejected", data: doc });
  } catch (error) {
    const status = error.message.includes("Forbidden") ? 403 : error.message.includes("not found") ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const requestRevision = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.userId || req.user._id;
    const orgId = req.user.organizationId;

    const doc = await approvalService.requestRevision(id, userId, orgId, comment);
    res.status(200).json({ success: true, message: "Revision requested", data: doc });
  } catch (error) {
    const status = error.message.includes("Forbidden") ? 403 : error.message.includes("not found") ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const publish = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user._id;
    const orgId = req.user.organizationId;

    const doc = await approvalService.publishDocument(id, userId, orgId);
    res.status(200).json({ success: true, message: "Document published", data: doc });
  } catch (error) {
    const status = error.message.includes("Forbidden") ? 403 : error.message.includes("not found") ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getPending = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const branchId = req.user.branchId;
    const { page = 1, limit = 20 } = req.query;

    const result = await approvalService.getPendingApprovals(orgId, branchId, parseInt(page), parseInt(limit));
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await approvalService.getDocumentApprovalHistory(id);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
