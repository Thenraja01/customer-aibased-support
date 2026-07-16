import * as dtService from "./documentType.service.js";

export const create = async (req, res) => {
  try {
    const dt = await dtService.createDocumentType(req.body);
    res.status(201).json({ success: true, data: dt });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const dts = await dtService.getAllDocumentTypes();
    res.status(200).json({ success: true, data: dts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const dt = await dtService.getDocumentTypeById(req.params.id);
    res.status(200).json({ success: true, data: dt });
  } catch (error) {
    const status = error.message === "Document type not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const dt = await dtService.updateDocumentType(req.params.id, req.body);
    res.status(200).json({ success: true, data: dt });
  } catch (error) {
    const status = error.message === "Document type not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await dtService.deleteDocumentType(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Document type not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
