import {
  generateApiKey,
  getOrganizationApiKeys,
  revokeApiKey,
} from "./apiKey.service.js";

export const createKey = async (req, res, next) => {
  try {
    const { name, type, scopes, expiresInDays, branch_id } = req.body;
    const organization_id = req.user?.organizationId || req.user?.organization_id || req.scope?.organizationId;
    const userId = req.user?.userId || req.user?._id || req.user?.id;

    if (!name) {
      return res.status(400).json({ success: false, message: "Key name is required" });
    }

    if (!organization_id) {
      return res.status(403).json({ success: false, message: "Organization scope required" });
    }

    const { apiKey, rawKey } = await generateApiKey({
      name,
      organization_id,
      branch_id: branch_id || req.user?.branchId || req.user?.branch_id || req.scope?.branchId || null,
      created_by: userId,
      type: type === "public" ? "public" : "secret",
      scopes: Array.isArray(scopes) && scopes.length > 0 ? scopes : ["*"],
      expiresInDays: expiresInDays ? Number(expiresInDays) : null,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "API Key created successfully. Save rawKey safely — it will not be shown again.",
      data: {
        id: apiKey._id,
        name: apiKey.name,
        type: apiKey.type,
        key_prefix: apiKey.key_prefix,
        rawKey,
        scopes: apiKey.scopes,
        expires_at: apiKey.expires_at,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listKeys = async (req, res, next) => {
  try {
    const organization_id = req.user?.organizationId || req.user?.organization_id || req.scope?.organizationId;
    if (!organization_id) {
      return res.status(403).json({ success: false, message: "Organization scope required" });
    }

    const keys = await getOrganizationApiKeys(organization_id);
    res.status(200).json({ success: true, data: keys });
  } catch (error) {
    next(error);
  }
};

export const deleteKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || req.user?.organization_id || req.scope?.organizationId;
    const userId = req.user?.userId || req.user?._id || req.user?.id;

    const revoked = await revokeApiKey({
      keyId: id,
      organizationId,
      userId,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    if (!revoked) {
      return res.status(404).json({ success: false, message: "API Key not found" });
    }

    res.status(200).json({ success: true, message: "API Key revoked successfully" });
  } catch (error) {
    next(error);
  }
};
