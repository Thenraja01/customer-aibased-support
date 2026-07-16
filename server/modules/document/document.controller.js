import * as docService from "./document.service.js";

export const upload = async (req, res) => {
  try {
    const docData = {
      ...req.body,
      file_url: req.file?.path || req.file?.url || "",
      file_size: req.file?.size || 0,
    };
    const doc = await docService.createDocument(docData);
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const docs = await docService.getAllDocuments();
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const doc = await docService.getDocumentById(req.params.id);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getByUser = async (req, res) => {
  try {
    const docs = await docService.getDocumentsByUser(req.params.userId);
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByStatus = async (req, res) => {
  try {
    const docs = await docService.getDocumentsByStatus(req.params.status);
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const patchStatus = async (req, res) => {
  try {
    const doc = await docService.updateDocumentStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await docService.deleteDocument(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
