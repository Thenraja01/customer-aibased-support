import { validateApiKey } from "../modules/api-key/apiKey.service.js";

/**
 * Middleware to authenticate requests via API Keys (x-api-key header or Bearer ak_live_...).
 * If an API key is provided and valid, populates req.user with API key scope.
 */
export const authenticateApiKey = async (req, res, next) => {
  let rawKey = req.headers["x-api-key"];

  if (!rawKey && req.headers.authorization && req.headers.authorization.startsWith("Bearer ak_")) {
    rawKey = req.headers.authorization.split(" ")[1];
  }

  if (!rawKey) {
    return next(); // Pass through to JWT auth middleware
  }

  try {
    const apiKeyDoc = await validateApiKey(rawKey);
    if (!apiKeyDoc) {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired API Key" });
    }

    req.user = {
      userId: apiKeyDoc.created_by.toString(),
      _id: apiKeyDoc.created_by,
      isApiKey: true,
      apiKeyId: apiKeyDoc._id.toString(),
      organization_id: apiKeyDoc.organization_id.toString(),
      organizationId: apiKeyDoc.organization_id.toString(),
      branchId: apiKeyDoc.branch_id ? apiKeyDoc.branch_id.toString() : null,
      roles: ["api_consumer"],
      roleName: "api_consumer",
      permissions: apiKeyDoc.scopes.includes("*")
        ? ["*"]
        : apiKeyDoc.scopes,
    };

    req.organizationId = apiKeyDoc.organization_id.toString();
    req.branchId = apiKeyDoc.branch_id ? apiKeyDoc.branch_id.toString() : null;

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "API key authentication failed" });
  }
};

export default { authenticateApiKey };
