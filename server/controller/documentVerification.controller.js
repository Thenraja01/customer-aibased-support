import {
  createVerification,
  getVerificationByDocument,
  getAllVerifications,
  getVerificationsByStatus,
  approveVerification,
  rejectVerification,
  deleteVerification,
} from "../service/documentVerification.service.js";

// POST /document-verifications
export const create = async (req, res) => {
  try {
    const verification = await createVerification(req.body);
    res.status(201).json({ success: true, data: verification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /document-verifications
export const getAll = async (req, res) => {
  try {
    const verifications = await getAllVerifications();
    res.status(200).json({ success: true, data: verifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /document-verifications/document/:documentId
export const getByDocument = async (req, res) => {
  try {
    const verification = await getVerificationByDocument(req.params.documentId);
    res.status(200).json({ success: true, data: verification });
  } catch (error) {
    const status = error.message === "Verification record not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// GET /document-verifications/status/:status
export const getByStatus = async (req, res) => {
  try {
    const verifications = await getVerificationsByStatus(req.params.status);
    res.status(200).json({ success: true, data: verifications });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /document-verifications/:id/approve
export const approve = async (req, res) => {
  try {
    const verification = await approveVerification(req.params.id, req.body.remarks);
    res.status(200).json({ success: true, data: verification });
  } catch (error) {
    const status = error.message === "Verification record not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

// PATCH /document-verifications/:id/reject
export const reject = async (req, res) => {
  try {
    const verification = await rejectVerification(req.params.id, req.body.remarks);
    res.status(200).json({ success: true, data: verification });
  } catch (error) {
    const status = error.message === "Verification record not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

// DELETE /document-verifications/:id
export const remove = async (req, res) => {
  try {
    const result = await deleteVerification(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Verification record not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
