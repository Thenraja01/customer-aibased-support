import DocumentChunk from "../document/documentChunk.schema.js";
import Document from "../document/document.schema.js";
import Faq from "../faq/faq.schema.js";
import { normalizeRoleName, isNormalizedAdminRole } from "../../utils/constants.js";

export const determineAccessScope = async (userId, organizationId, roleName, roleId) => {
  const scope = {
    authorizedDocumentIds: [],
    accessibleRoles: [],
    scopeLevel: "user",
    canViewAll: false,
    knowledgeBaseScope: {},
  };

  if (!organizationId) {
    scope.scopeLevel = "none";
    return scope;
  }

  const normalizedRole = normalizeRoleName(roleName);

  if (!normalizedRole || normalizedRole === "public") {
    scope.scopeLevel = "anonymous";
    const publicChunks = await DocumentChunk.find({
      organization_id: organizationId,
      status: "approved",
      assigned_role: { $in: ["all", "public"] },
    })
      .select("document_id")
      .lean();
    scope.authorizedDocumentIds = [...new Set(publicChunks.map((d) => d.document_id.toString()))];
    scope.canViewAll = scope.authorizedDocumentIds.length > 0;
    scope.accessibleRoles = ["all", "public"];
    scope.scopeLevel = "public";
    return scope;
  }

  if (isNormalizedAdminRole(normalizedRole)) {
    const adminDocIds = await DocumentChunk.find({
      organization_id: organizationId,
      status: "approved",
    })
      .select("document_id")
      .lean();
    scope.authorizedDocumentIds = [...new Set(adminDocIds.map((d) => d.document_id.toString()))];
    scope.canViewAll = true;
    scope.accessibleRoles = ["all", normalizedRole, "public", "customer", "support"];
    scope.scopeLevel = "org";
    return scope;
  }

  const assignedRoleDocs = await DocumentChunk.find({
    organization_id: organizationId,
    status: "approved",
    assigned_role: { $in: [normalizedRole, "all", "public"] },
  })
    .select("document_id")
    .lean();

  scope.authorizedDocumentIds = [...new Set(assignedRoleDocs.map((d) => d.document_id.toString()))];
  scope.canViewAll = scope.authorizedDocumentIds.length > 0;
  scope.accessibleRoles = [normalizedRole, "all", "public"];
  scope.scopeLevel = "role";

  scope.knowledgeBaseScope = {
    roleFilter: { $in: [normalizedRole, "all", "public"] },
    authorizedDocumentIds: scope.authorizedDocumentIds,
    statusFilter: "approved",
  };

  return scope;
};

/**
 * Initialize lightweight session context.
 * BUG FIX: Removed redundant Message.countDocuments + Message.find queries.
 * aiChat.service.js already loads recentMessages separately, making these
 * DB calls pure wasted I/O (2 extra round trips per message).
 */
export const initializeSessionContext = async (chatId, userId, organizationId) => {
  return {
    chatId,
    userId,
    organizationId,
    hasHistory: Boolean(chatId),
    messageCount: -1,     // populated lazily by caller if needed
    shortTermMemory: [],  // populated by aiChat.service.js recentMessages
    conversationSummary: null,
  };
};

export default {
  determineAccessScope,
  initializeSessionContext,
};
