import {
  createDocument,
  getAllDocuments,
  getDocumentById,
  getDocumentsByUser,
  getDocumentsByStatus,
  updateDocumentStatus,
  updateRagStatus,
  getDocumentsPendingRag,
  deleteDocument,
} from "../service/document.service.js";

// POST /documents
export const upload = async (req, res) => {
  try {
    // file_path comes from upload middleware (Cloudinary URL or local path)
    const { user_id, document_type_id } = req.body;
    const file_name = req.file?.originalname || req.body.file_name;
    const file_path = req.file?.path || req.body.file_path;
    const uploaded_by = req.user?.id || req.body.uploaded_by;

    const doc = await createDocument({ user_id, document_type_id, file_name, file_path, uploaded_by });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /documents
export const getAll = async (req, res) => {
  try {
    const docs = await getAllDocuments();
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /documents/pending-rag
export const getPendingRag = async (req, res) => {
  try {
    const docs = await getDocumentsPendingRag();
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /documents/:id
export const getById = async (req, res) => {
  try {
    const doc = await getDocumentById(req.params.id);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// GET /documents/user/:userId
export const getByUser = async (req, res) => {
  try {
    const docs = await getDocumentsByUser(req.params.userId);
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /documents/status/:status
export const getByStatus = async (req, res) => {
  try {
    const docs = await getDocumentsByStatus(req.params.status);
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /documents/:id/status
export const patchStatus = async (req, res) => {
  try {
    const doc = await updateDocumentStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

// PATCH /documents/:id/rag-status
export const patchRagStatus = async (req, res) => {
  try {
    const doc = await updateRagStatus(req.params.id, req.body.rag_status);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

// DELETE /documents/:id
export const remove = async (req, res) => {
  try {
    const result = await deleteDocument(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
