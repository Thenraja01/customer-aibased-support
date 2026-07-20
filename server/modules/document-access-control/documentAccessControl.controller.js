import * as documentAccessControlService from "./documentAccessControl.service.js";

export const create = async (req, res) => {
  try {
    const access = await documentAccessControlService.createAccess(req.body);
    res.status(201).json({ success: true, data: access });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getByDocument = async (req, res) => {
  try {
    const access = await documentAccessControlService.getByDocument(req.params.documentId);
    res.status(200).json({ success: true, data: access });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const query = {};
    if (req.query.document_id) query.document_id = req.query.document_id;
    const access = await documentAccessControlService.getAll(query);
    res.status(200).json({ success: true, data: access });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const access = await documentAccessControlService.updateAccess(req.params.id, req.body);
    res.status(200).json({ success: true, data: access });
  } catch (error) {
    const status = error.message === "Access control entry not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await documentAccessControlService.deleteAccess(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Access control entry not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
