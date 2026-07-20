import Document from "../modules/document/document.schema.js";
import ApiError from "../utils/ApiError.js";
import { normalizeRoleName } from "./auth.middleware.js";

const isSameOrg = (documentOrgId, requestOrgId) => {
  if (!requestOrgId) return true;
  return String(documentOrgId) === String(requestOrgId);
};

const canAccessAnyDocument = (roleName) => ["admin", "super_admin"].includes(normalizeRoleName(roleName));

const canReviewDocument = (roleName) => ["admin", "super_admin", "support"].includes(normalizeRoleName(roleName));

export const checkDocumentAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const roleName = normalizeRoleName(user?.roleName);
    const organizationId = req.organization?._id || user.organizationId || user.organization_id;

    const document = await Document.findOne({
      _id: id,
      is_deleted: { $ne: true },
    });

    if (!document) {
      throw new ApiError(404, "Document not found");
    }

    if (!isSameOrg(document.organization_id, organizationId) && roleName !== "super_admin") {
      throw new ApiError(403, "Access denied: document belongs to different organization");
    }

    if (!canAccessAnyDocument(roleName)) {
      const isOwner = String(document.user_id) === String(user?.userId);
      if (!isOwner && !canReviewDocument(roleName)) {
        throw new ApiError(403, "Access denied: insufficient permissions for this document");
      }
    }

    req.document = document;
    next();
  } catch (error) {
    next(error);
  }
};

export const checkKnowledgeBaseUpload = async (req, res, next) => {
  try {
    const roleName = normalizeRoleName(req.user?.roleName);
    const isKnowledgeBase = req.body.is_knowledge_base === true || req.body.isOrgDoc === true;

    if (isKnowledgeBase && !["admin", "super_admin"].includes(roleName)) {
      throw new ApiError(403, "Only organization admins can upload knowledge base documents");
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const filterDocumentsByRole = (req, res, next) => {
  try {
    const roleName = normalizeRoleName(req.user?.roleName);
    const organizationId = req.organization?._id || req.user.organizationId || req.user.organization_id;

    req.documentFilter = {
      is_deleted: { $ne: true },
    };

    if (roleName !== "super_admin" || organizationId) {
      req.documentFilter.organization_id = organizationId;
    }

    if (roleName === "customer" || roleName === "user" || roleName === "member") {
      req.documentFilter.user_id = req.user.userId;
    }

    if (!canReviewDocument(roleName)) {
      req.documentFilter.status = "approved";
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const checkKnowledgeBaseType = async (req, res, next) => {
  try {
    const roleName = normalizeRoleName(req.user?.roleName);

    if (!["admin", "super_admin"].includes(roleName)) {
      throw new ApiError(403, "Only organization admins can manage knowledge base document types");
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const canReviewDocuments = canReviewDocument;
