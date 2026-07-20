import * as docService from "./document.service.js";
import downloadService from "../../services/download.service.js";
import ragService from "../../services/rag.service.js";
import { enqueueDocument } from "../../workers/rag.worker.js";
import { normalizeRoleName } from "../../middleware/auth.middleware.js";

export const upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const organizationId = req.organization?._id || req.user.organizationId || req.user.organization_id;
    const isKnowledgeBase = req.body.is_knowledge_base === true || req.body.is_knowledge_base === "true" || req.body.isOrgDoc === true || req.body.isOrgDoc === "true";

    const docData = {
      ...req.body,
      user_id: req.body.user_id || req.user.userId,
      organization_id: organizationId,
      file_data: req.file.buffer,
      file_mimetype: req.file.mimetype,
      file_name: req.file.originalname,
      file_size: req.file.size,
      is_knowledge_base: isKnowledgeBase,
      status: isKnowledgeBase ? "pending_review" : "draft",
      rag_status: isKnowledgeBase ? "pending" : "pending",
      approval_meta: {
        decision: isKnowledgeBase ? "pending_review" : "draft",
        decision_by: null,
        decision_role: null,
        decision_at: null,
        decision_reason: null,
      },
    };
    const doc = await docService.createDocument(docData);
    const { file_data, ...docResponse } = doc.toObject();

    if (isKnowledgeBase) {
      enqueueDocument(doc._id, organizationId, req.file.buffer, req.file.mimetype).catch((error) =>
        console.error("RAG queue failed:", error.message)
      );
    }

    res.status(201).json({ success: true, data: docResponse });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const { page, limit, status, typeId, search, sortBy, sortOrder } = req.query;
    const result = await docService.getAllDocuments(req.documentFilter, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: req.documentFilter.status ? undefined : status,
      typeId,
      search,
      sortBy,
      sortOrder,
    });
    res.status(200).json({ success: true, ...(result.pagination ? result : { data: result }) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const orgId = req.organization?._id || req.user.organizationId || req.user.organization_id;
    const doc = await docService.getDocumentById(req.params.id, false, orgId);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getByUser = async (req, res) => {
  try {
    const organizationId = req.organization?._id || req.user.organizationId || req.user.organization_id;
    const docs = await docService.getDocumentsByUser(req.params.userId, organizationId);
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByStatus = async (req, res) => {
  try {
    const organizationId = req.organization?._id || req.user.organizationId || req.user.organization_id;
    const docs = await docService.getDocumentsByStatus(req.params.status, organizationId);
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const orgId = req.organization?._id || req.user.organizationId || req.user.organization_id;
    const doc = await docService.updateDocument(req.params.id, req.body, orgId);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const patchStatus = async (req, res) => {
  try {
    const orgId = req.organization?._id || req.user.organizationId || req.user.organization_id;
    const doc = await docService.updateDocumentStatus(req.params.id, req.body.status, {
      decision_by: req.user.userId,
      decision_role: normalizeRoleName(req.user.roleName),
      decision_at: new Date(),
      decision_reason: req.body.reason,
    }, orgId);
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const orgId = req.organization?._id || req.user.organizationId || req.user.organization_id;
    const result = await docService.deleteDocument(req.params.id, orgId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const download = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({ success: false, message: "Download token required" });
    }

    const payload = downloadService.verifyDownloadToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, message: "Invalid or expired download token" });
    }

    if (!downloadService.isAuthorized(token, req.params.id, req.user.userId)) {
      return res.status(403).json({ success: false, message: "Unauthorized download" });
    }

    const orgId = req.organization?._id || req.user.organizationId || req.user.organization_id;
    const doc = await docService.getDocumentById(req.params.id, true, orgId);
    res.set("Content-Type", doc.file_mimetype);
    res.set("Content-Disposition", `attachment; filename="${doc.file_name}"`);
    res.send(doc.file_data);
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getDownloadUrl = async (req, res) => {
  try {
    const orgId = req.organization?._id || req.user.organizationId || req.user.organization_id;
    const doc = await docService.getDocumentById(req.params.id, false, orgId);
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const downloadUrl = downloadService.generateDownloadUrl(doc._id, req.user.userId, baseUrl);
    res.status(200).json({ success: true, data: { download_url: downloadUrl } });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const reindexDocument = async (req, res) => {
  try {
    const orgId = req.organization?._id || req.user.organizationId || req.user.organization_id;
    const doc = await docService.getDocumentById(req.params.id, true, orgId);

    if (!doc.is_knowledge_base) {
      return res.status(400).json({
        success: false,
        message: "Only knowledge base documents can be reindexed",
      });
    }

    doc.rag_status = "pending";
    doc.rag_queued_at = new Date();
    doc.rag_error = null;
    await doc.save();

    const fullDoc = await docService.getDocumentById(req.params.id, true, orgId);
    enqueueDocument(doc._id, orgId, fullDoc.file_data, fullDoc.file_mimetype).catch((error) =>
      console.error("RAG reindex queue failed:", error.message)
    );

    res.status(200).json({
      success: true,
      message: "Document queued for reindexing via BullMQ",
      data: {
        document_id: doc._id,
        rag_status: doc.rag_status,
      },
    });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const bulkUpload = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const organizationId = req.organization?._id || req.user.organizationId || req.user.organization_id;
    const isKnowledgeBase = req.body.is_knowledge_base === true || req.body.is_knowledge_base === "true" || req.body.isOrgDoc === true || req.body.isOrgDoc === "true";
    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const docData = {
          title: file.originalname,
          user_id: req.user.userId,
          organization_id: organizationId,
          file_data: file.buffer,
          file_mimetype: file.mimetype,
          file_name: file.originalname,
          file_size: file.size,
          is_knowledge_base: isKnowledgeBase,
          status: isKnowledgeBase ? "pending_review" : "draft",
          rag_status: isKnowledgeBase ? "pending" : "pending",
        };
        const doc = await docService.createDocument(docData);
        const { file_data, ...docResponse } = doc.toObject();
        results.push(docResponse);

        if (isKnowledgeBase) {
          enqueueDocument(doc._id, organizationId, file.buffer, file.mimetype).catch((error) =>
            console.error("RAG queue failed:", error.message)
          );
        }
      } catch (error) {
        errors.push({
          file: file.originalname,
          error: error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        uploaded: results.length,
        failed: errors.length,
        documents: results,
        errors: errors,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getChunks = async (req, res) => {
  try {
    const chunks = await ragService.getDocumentChunks(req.params.id);
    res.status(200).json({ success: true, data: chunks });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getRagStatus = async (req, res) => {
  try {
    const status = await ragService.getDocumentStatus(req.params.id);
    res.status(200).json({ success: true, data: status });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
