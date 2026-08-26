import * as docService from "./document.service.js";
import { normalizeRoleName } from "../../utils/constants.js";
import mongoose from "mongoose";

// Helper to append secure file_url to document objects dynamically
const formatDoc = (req, doc) => {
  if (!doc) return null;
  const docObj = doc.toObject ? doc.toObject() : doc;
  docObj.file_url = `${req.protocol}://${req.get("host")}/documents/${docObj._id}/view?token=${req.token || ""}`;
  return docObj;
};

export const upload = async (req, res) => {
  try {
    const userRole = req.user?.roleName || req.user?.role || req.user?.role_id?.role_name;
    // Only org-level admins (admin / super_admin) self-approve; branch_admin uploads wait for admin review
    const isAdmin = ["admin", "super_admin"].includes(normalizeRoleName(userRole));

    let branchId = null;
    if (req.body.branch_id && req.body.branch_id !== "all" && req.body.branch_id !== "ALL") {
      branchId = req.body.branch_id;
    } else if (req.body.branch_id === undefined && (req.user?.branchId || req.user?.branch_id)) {
      branchId = req.user?.branchId || req.user?.branch_id;
    }

    const visibility = req.body.visibility || (branchId ? "branch" : "organization");

    let allowedRoles = ["admin", "branch_admin", "support"]; // Default
    if (req.body.allowed_roles) {
      if (Array.isArray(req.body.allowed_roles)) {
        allowedRoles = req.body.allowed_roles;
      } else if (typeof req.body.allowed_roles === "string") {
        try {
          allowedRoles = JSON.parse(req.body.allowed_roles);
        } catch {
          allowedRoles = req.body.allowed_roles.split(",").map((r) => r.trim()).filter(Boolean);
        }
      }
    }
    const normalizedAllowedRoles = allowedRoles.map(normalizeRoleName).filter(Boolean);

    const docData = {
      user_id: req.user.userId || req.user._id,
      organization_id: req.body.organization_id || req.user.organizationId,
      branch_id: branchId,
      title: req.body.title,
      description: req.body.description || "",
      document_type_id: req.body.document_type_id || undefined,
      assigned_role: req.body.assigned_role || "All",
      role_ids: req.body.role_ids,
      allowed_roles: normalizedAllowedRoles,
      visibility,
      accessPolicy: req.body.accessPolicy,
      customerVisible: req.body.customerVisible,
    };

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const doc = await docService.createDocument(
      docData,
      req.user.userId || req.user._id,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      isAdmin
    );
    res.status(201).json({ success: true, data: formatDoc(req, doc) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const uploadNewVersion = async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const rawOrgId = req.scope?.organizationId || req.user?.organizationId || req.user?.organization_id;
    const orgId = typeof rawOrgId === "object" && rawOrgId?._id ? rawOrgId._id : rawOrgId;
    const rawBranchId = req.scope?.branchId || req.user?.branchId || req.user?.branch_id;
    const branchId = typeof rawBranchId === "object" && rawBranchId?._id ? rawBranchId._id : rawBranchId;
    const userRole = req.user?.roleName || req.user?.role || req.user?.role_id?.name;
    const changelog = req.body.changelog || "New version uploaded";

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const doc = await docService.uploadNewVersion(
      documentId,
      userId,
      orgId,
      branchId,
      userRole,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      changelog
    );

    res.status(200).json({ success: true, data: formatDoc(req, doc) });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 403;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const viewDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const user = req.user;

    const doc = await docService.getDocumentForViewing(documentId, user);
    
    // Generate a signed URL for secure direct download/viewing from Cloudinary
    const { generateSignedUrl } = await import("../../services/cloudinary.service.js");
    const signedUrl = generateSignedUrl(doc.cloudinary_public_id, doc.cloudinary_resource_type);
    
    if (req.query.json === 'true') {
      return res.status(200).json({ success: true, url: signedUrl });
    }

    // Redirect the client to the Cloudinary signed URL
    res.redirect(signedUrl);
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 403;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    let rawOrgId = req.query.organization_id || req.user?.organizationId || req.user?.organization_id || null;
    let organizationId = typeof rawOrgId === "object" && rawOrgId?._id ? rawOrgId._id : rawOrgId;
    let rawBranchId = req.query.branch_id || req.query.branchId || req.user?.branch_id || req.user?.branchId || null;
    let branchId = typeof rawBranchId === "object" && rawBranchId?._id ? rawBranchId._id : rawBranchId;
    const userRole = req.user?.roleName || req.user?.role || req.user?.role_id?.name;

    // Reject malformed ObjectId filters (would otherwise throw a CastError → 400).
    if (organizationId && !mongoose.isValidObjectId(organizationId)) {
      organizationId = req.user?.organizationId || null;
    }
    if (branchId && !mongoose.isValidObjectId(branchId)) {
      branchId = null;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || "";
    const search = req.query.search || "";
    const result = await docService.getAllDocuments(organizationId, branchId, page, limit, status, search, userRole);
    const dataWithUrl = result.data.map((d) => formatDoc(req, d));
    res.status(200).json({ success: true, data: dataWithUrl, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const doc = await docService.getDocumentById(req.params.id);
    res.status(200).json({ success: true, data: formatDoc(req, doc) });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getByUser = async (req, res) => {
  try {
    const roleName = req.user?.roleName;
    const roleId = req.user?.roleId;
    const organizationId = req.user?.organizationId;
    const docs = await docService.getDocumentsByUser(req.params.userId, roleName, roleId, organizationId);
    const docsWithUrl = docs.map((d) => formatDoc(req, d));
    res.status(200).json({ success: true, data: docsWithUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByStatus = async (req, res) => {
  try {
    const docs = await docService.getDocumentsByStatus(req.params.status);
    const docsWithUrl = docs.map((d) => formatDoc(req, d));
    res.status(200).json({ success: true, data: docsWithUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approve = async (req, res) => {
  try {
    const doc = await docService.approveDocument(req.params.id, req.user.userId);
    res.status(200).json({ success: true, data: formatDoc(req, doc) });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const reject = async (req, res) => {
  try {
    const doc = await docService.rejectDocument(req.params.id, req.user.userId, req.body.remarks);
    res.status(200).json({ success: true, data: formatDoc(req, doc) });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const publish = async (req, res) => {
  try {
    const doc = await docService.publishDocument(req.params.id, req.user.userId);
    res.status(200).json({ success: true, data: formatDoc(req, doc) });
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
    if (req.body.remarks) {
      updateData.rejection_reason = req.body.remarks;
    }
    const doc = await docService.updateDocumentStatus(req.params.id, updateData);
    res.status(200).json({ success: true, data: formatDoc(req, doc) });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const rawOrgId = req.scope?.organizationId || req.user?.organizationId || req.user?.organization_id;
    const orgId = typeof rawOrgId === "object" && rawOrgId?._id ? rawOrgId._id : rawOrgId;
    const rawBranchId = req.scope?.branchId || req.user?.branchId || req.user?.branch_id;
    const branchId = typeof rawBranchId === "object" && rawBranchId?._id ? rawBranchId._id : rawBranchId;
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";

    const result = await docService.deleteDocument(
      req.params.id,
      isSuperAdmin ? null : orgId,
      isSuperAdmin ? null : branchId
    );
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await docService.getDocumentRoleAccess(req.params.id);
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setRoles = async (req, res) => {
  try {
    const { role_ids } = req.body;
    const orgId = req.user.organizationId;
    await docService.setDocumentRoleAccess(req.params.id, role_ids, orgId);
    const roles = await docService.getDocumentRoleAccess(req.params.id);
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const retryIngestion = async (req, res) => {
  try {
    const orgId = req.user?.roleName === "super_admin" ? null : req.user?.organizationId;
    const branchId = (req.user?.roleName === "branch_admin" || req.user?.roleName === "support") ? req.user?.branchId : null;
    const doc = await docService.retryDocumentIngestion(req.params.id, orgId, branchId);
    res.status(200).json({ success: true, message: "Document re-ingestion started successfully", data: doc });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const updateMetadata = async (req, res) => {
  try {
    const docId = req.params.id;
    const { title, description, allowed_roles, visibility, customerVisible, document_type_id, branch_id, assigned_role } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (document_type_id !== undefined) updateData.document_type_id = document_type_id;
    if (branch_id !== undefined) updateData.branch_id = branch_id;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (customerVisible !== undefined) updateData.customerVisible = customerVisible;
    if (assigned_role !== undefined) updateData.assigned_role = assigned_role;
    if (allowed_roles !== undefined) {
      const roles = Array.isArray(allowed_roles) ? allowed_roles : [allowed_roles];
      updateData.allowed_roles = roles.map(normalizeRoleName).filter(Boolean);
    }
    const doc = await docService.updateDocumentStatus(docId, updateData);
    res.status(200).json({ success: true, data: formatDoc(req, doc) });
  } catch (error) {
    const status = error.message === "Document not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getDocumentContent = async (req, res) => {
  try {
    const doc = await docService.getDocumentById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    const { getChunksByDocument } = await import("./documentChunk.service.js");
    const chunks = await getChunksByDocument(req.params.id);
    const content = chunks.map((c) => c.text || c.content).join("\n\n");
    res.status(200).json({ success: true, data: { text: content, chunks } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateSummary = async (req, res) => {
  try {
    const { getChunksByDocument } = await import("./documentChunk.service.js");
    const chunks = await getChunksByDocument(req.params.id);
    const textSample = chunks.slice(0, 5).map((c) => c.text || c.content).join("\n\n");
    let summary = "Summary not available";
    if (textSample) {
      const { generateResponse } = await import("../llm/index.js");
      summary = await generateResponse({
        prompt: `Please provide a concise 2-3 sentence executive summary for the following document text:\n\n${textSample.substring(0, 2500)}`,
        temperature: 0.3,
        maxTokens: 300,
      });
    }
    res.status(200).json({ success: true, data: { summary } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

