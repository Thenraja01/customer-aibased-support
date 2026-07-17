import AuditLog from "../modules/audit-log/auditLog.schema.js";

const TRACKED_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

const ROUTE_TABLE_MAP = {
  "/users": "users",
  "/chats": "chats",
  "/messages": "messages",
  "/tickets": "tickets",
  "/notifications": "notifications",
  "/documents": "documents",
  "/document-types": "document_types",
  "/document-verifications": "document_verifications",
  "/organizations": "organizations",
  "/roles": "roles",
  "/faqs": "faqs",
  "/memory": "chat_memory",
  "/rag": "rag",
  "/knowledge-graph": "knowledge_graph",
  "/ai-sessions": "ai_sessions",
  "/admin/v1": "admin",
};

const METHOD_ACTION_MAP = {
  POST: "create",
  PUT: "update",
  PATCH: "update",
  DELETE: "delete",
};

export const auditLogger = async (req, res, next) => {
  if (!TRACKED_METHODS.includes(req.method)) {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = function (body) {
    res.json = originalJson;

    if (res.statusCode >= 200 && res.statusCode < 300 && body?.success !== false) {
      const table = detectTable(req.path);
      const action = METHOD_ACTION_MAP[req.method] || req.method.toLowerCase();

      if (table) {
        const logData = {
          user_id: req.user?.userId || null,
          action: `${action}_${table}`,
          table_name: table,
          record_id: extractRecordId(req),
          old_value: req.method === "PUT" || req.method === "PATCH" ? req.body : undefined,
          new_value: body?.data ? sanitizeForLog(body.data) : undefined,
        };

        AuditLog.create(logData).catch((err) =>
          console.error("[AuditLog] Failed to create log:", err.message)
        );
      }
    }

    return originalJson(body);
  };

  next();
};

function detectTable(path) {
  for (const [prefix, table] of Object.entries(ROUTE_TABLE_MAP)) {
    if (path.startsWith(prefix)) return table;
  }
  return null;
}

function extractRecordId(req) {
  const params = req.params;
  return params.id || params.userId || params.documentId || params.memoryId || params.chatId || null;
}

function sanitizeForLog(data) {
  if (!data || typeof data !== "object") return data;

  const sanitized = { ...data };
  const sensitiveFields = ["password", "token", "secret", "api_key"];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "***REDACTED***";
    }
  }

  return sanitized;
}
