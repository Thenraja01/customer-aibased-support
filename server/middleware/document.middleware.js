import Document from "../modules/document/document.schema.js";
import ApiError from "../utils/ApiError.js";

/**
 * Check if user has access to a specific document
 * - Admins can access all documents in their org
 * - Support and customers can only access approved documents
 */
export const checkDocumentAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const organizationId = req.organization?._id || req.user.organizationId;

    const document = await Document.findOne({
      _id: id,
      is_deleted: { $ne: true },
    });

    if (!document) {
      throw new ApiError(404, "Document not found");
    }

    // Check organization scope
    if (document.organization_id.toString() !== organizationId.toString()) {
      throw new ApiError(403, "Access denied: document belongs to different organization");
    }

    // Role-based access
    if (user.roleName !== "admin" && user.roleName !== "super_admin") {
      if (document.status !== "approved") {
        throw new ApiError(403, "Access denied: document is not approved");
      }
    }

    req.document = document;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user can upload knowledge base documents
 * - Only admins can upload knowledge base documents
 * - Customers can only upload KYC documents
 */
export const checkKnowledgeBaseUpload = async (req, res, next) => {
  try {
    const user = req.user;
    const isKnowledgeBase = req.body.is_knowledge_base === true || req.body.isOrgDoc === true;

    if (isKnowledgeBase && user.roleName !== "admin" && user.roleName !== "super_admin") {
      throw new ApiError(403, "Only admins can upload knowledge base documents");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Filter documents by role at middleware level
 * - Admins: see all documents in org
 * - Support/customers: see only approved documents
 */
export const filterDocumentsByRole = (req, res, next) => {
  try {
    const user = req.user;
    const organizationId = req.organization?._id || req.user.organizationId;

    req.documentFilter = {
      organization_id: organizationId,
      is_deleted: { $ne: true },
    };

    if (user.roleName !== "admin" && user.roleName !== "super_admin") {
      req.documentFilter.status = "approved";
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if document type is knowledge base type
 * Used to restrict knowledge base operations
 */
export const checkKnowledgeBaseType = async (req, res, next) => {
  try {
    const user = req.user;

    // Only admins can manage knowledge base types
    if (user.roleName !== "admin" && user.roleName !== "super_admin") {
      throw new ApiError(403, "Only admins can manage knowledge base document types");
    }

    next();
  } catch (error) {
    next(error);
  }
};
