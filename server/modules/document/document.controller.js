import * as docService from "./document.service.js";

export const upload = async (req, res) => {
  try {
    const docData = {
      user_id: req.user.userId,
      organization_id: req.user.organization_id,
      title: req.body.title,
      document_type_id: req.body.document_type_id,
      assigned_role: req.body.assigned_role || "All",
      status: "draft",
    };
    const doc = await docService.createDocument(
      docData,
      req.user.userId,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
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

export const approve = async (req, res) => {
  try {
    const doc = await docService.approveDocument(req.params.id, req.user.userId);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const reject = async (req, res) => {
  try {
    const doc = await docService.rejectDocument(req.params.id, req.user.userId, req.body.remarks);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const patchStatus = async (req, res) => {
  try {
    const updateData = {
      status: req.body.status,
    };
    if (req.body.assigned_role) {
      updateData.assigned_role = req.body.assigned_role;
    }
    const doc = await docService.updateDocumentStatus(req.params.id, updateData);
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
