import {
  createDocumentType,
  getAllDocumentTypes,
  getDocumentTypeById,
  updateDocumentType,
  deleteDocumentType,
} from "../service/documentType.service.js";

// POST /document-types
export const create = async (req, res) => {
  try {
    const type = await createDocumentType(req.body.name);
    res.status(201).json({ success: true, data: type });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /document-types
export const getAll = async (req, res) => {
  try {
    const types = await getAllDocumentTypes();
    res.status(200).json({ success: true, data: types });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /document-types/:id
export const getById = async (req, res) => {
  try {
    const type = await getDocumentTypeById(req.params.id);
    res.status(200).json({ success: true, data: type });
  } catch (error) {
    const status = error.message === "Document type not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// PUT /document-types/:id
export const update = async (req, res) => {
  try {
    const type = await updateDocumentType(req.params.id, req.body.name);
    res.status(200).json({ success: true, data: type });
  } catch (error) {
    const status = error.message === "Document type not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

// DELETE /document-types/:id
export const remove = async (req, res) => {
  try {
    const result = await deleteDocumentType(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Document type not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
