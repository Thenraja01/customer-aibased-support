import * as dvService from "./documentVerification.service.js";

export const create = async (req, res) => {
  try {
    const v = await dvService.createVerification(req.body);
    res.status(201).json({ success: true, data: v });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const vs = await dvService.getAllVerifications();
    res.status(200).json({ success: true, data: vs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByDocument = async (req, res) => {
  try {
    const v = await dvService.getVerificationByDocument(req.params.documentId);
    res.status(200).json({ success: true, data: v });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByStatus = async (req, res) => {
  try {
    const vs = await dvService.getVerificationsByStatus(req.params.status);
    res.status(200).json({ success: true, data: vs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approve = async (req, res) => {
  try {
    const v = await dvService.approveVerification(req.params.id, req.user);
    res.status(200).json({ success: true, data: v });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const reject = async (req, res) => {
  try {
    const v = await dvService.rejectVerification(req.params.id, req.body.remarks);
    res.status(200).json({ success: true, data: v });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await dvService.deleteVerification(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
