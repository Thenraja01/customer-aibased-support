import * as documentShareService from "./documentShare.service.js";

export const create = async (req, res) => {
  try {
    const data = { ...req.body, shared_by: req.user.userId };
    const share = await documentShareService.createShare(data);
    res.status(201).json({ success: true, data: share });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getByDocument = async (req, res) => {
  try {
    const shares = await documentShareService.getSharesForDocument(req.params.documentId);
    res.status(200).json({ success: true, data: shares });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyShares = async (req, res) => {
  try {
    const shares = await documentShareService.getSharesForUser(req.user.userId);
    res.status(200).json({ success: true, data: shares });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const query = {};
    if (req.query.document_id) query.document_id = req.query.document_id;
    const shares = await documentShareService.getAll(query);
    res.status(200).json({ success: true, data: shares });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const share = await documentShareService.updateShare(req.params.id, req.body);
    res.status(200).json({ success: true, data: share });
  } catch (error) {
    const status = error.message === "Share not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await documentShareService.deleteShare(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Share not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
