import AIConfig from "./schemas/aiConfig.schema.js";
import { encrypt, decrypt } from "../../utils/crypto.utils.js";
import { testProviderConnection } from "../llm/index.js";
import * as auditLogService from "../audit-log/auditLog.service.js";
import mongoose from "mongoose";

// Helper to mask key: returns "****[last 4 chars]" or null
const maskKey = (encryptedKey) => {
  if (!encryptedKey) return null;
  const decrypted = decrypt(encryptedKey);
  if (!decrypted) return "****";
  if (decrypted.length <= 4) return "****";
  return `****${decrypted.slice(-4)}`;
};

// Best-effort audit trail — never fails the primary operation.
const audit = async (req, action, recordId, newValue, oldValue) => {
  try {
    await auditLogService.logAction({
      user_id: req.user?.userId || req.user?._id,
      organization_id: req.user?.organizationId || req.scope?.organizationId,
      branch_id: null,
      action,
      table_name: "ai_config",
      record_id: String(recordId),
      old_value: oldValue,
      new_value: newValue,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error(`[aiConfig] Audit log failed (${action}):`, err.message);
  }
};

const orgIdFrom = (req) => req.scope?.organizationId || req.user?.organizationId;

// POST /admin/v1/ai-configs/:id/test
export const testAIConfig = async (req, res) => {
  try {
    const orgId = orgIdFrom(req);
    const { id } = req.params;

    const config = await AIConfig.findById(id);
    if (!config) {
      return res.status(404).json({ success: false, message: "AIConfig not found" });
    }

    if (orgId && config.organization_id.toString() !== orgId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden: Cannot access other organization settings" });
    }

    const apiKey = config.apiKey ? decrypt(config.apiKey) : undefined;
    const result = await testProviderConnection({
      provider: config.provider,
      apiKey,
      model: config.model,
    });

    await audit(req, "AI_PROVIDER_TESTED", config._id, { status: result.status });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /admin/v1/ai-configs
export const getAIConfigs = async (req, res) => {
  try {
    const orgId = orgIdFrom(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }

    const configs = await AIConfig.find({ organization_id: orgId })
      .sort({ created_at: -1 })
      .lean();

    // Mask secret keys before sending to the client
    const sanitizedConfigs = configs.map((c) => ({
      ...c,
      apiKey: c.apiKey ? maskKey(c.apiKey) : null,
      configured: !!c.apiKey,
    }));

    res.status(200).json({ success: true, data: sanitizedConfigs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /admin/v1/ai-configs
export const createAIConfig = async (req, res) => {
  try {
    const orgId = orgIdFrom(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }

    const { provider, model, display_name, enabled, default: isDefault, apiKey, configuration, usage_limits } = req.body;

    if (!provider || !model || !display_name) {
      return res.status(400).json({ success: false, message: "provider, model, and display_name are required" });
    }

    // Encrypt key if provided
    const encryptedKey = apiKey ? encrypt(apiKey) : null;

    // If setting default, unset others first
    if (isDefault) {
      await AIConfig.updateMany({ organization_id: orgId }, { default: false });
    }

    const config = await AIConfig.create({
      organization_id: orgId,
      provider,
      model,
      display_name,
      enabled: enabled !== false,
      default: isDefault === true,
      apiKey: encryptedKey,
      configuration: configuration || {},
      usage_limits: usage_limits || {},
    });

    const result = config.toObject();
    result.apiKey = result.apiKey ? maskKey(result.apiKey) : null;
    result.configured = !!encryptedKey;

    await audit(req, "AI_PROVIDER_CREATED", config._id, { provider, model, display_name });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /admin/v1/ai-configs/:id
export const updateAIConfig = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId || req.user?.organizationId;
    const { id } = req.params;

    const config = await AIConfig.findById(id);
    if (!config) {
      return res.status(404).json({ success: false, message: "AIConfig not found" });
    }

    // Verify organization ownership
    if (config.organization_id.toString() !== orgId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden: Cannot access other organization settings" });
    }

    const { provider, model, display_name, enabled, default: isDefault, apiKey, configuration, usage_limits } = req.body;

    if (provider) config.provider = provider;
    if (model) config.model = model;
    if (display_name) config.display_name = display_name;
    if (enabled !== undefined) config.enabled = enabled;
    if (configuration) config.configuration = { ...config.configuration, ...configuration };
    if (usage_limits) config.usage_limits = { ...config.usage_limits, ...usage_limits };

    // Update API Key if sent and not masked
    if (apiKey !== undefined) {
      if (apiKey === null || apiKey === "") {
        config.apiKey = null;
      } else if (!apiKey.startsWith("****")) {
        config.apiKey = encrypt(apiKey);
      }
    }

    // Handle default unsetting/setting
    if (isDefault !== undefined) {
      if (isDefault && !config.default) {
        await AIConfig.updateMany({ organization_id: orgId }, { default: false });
        config.default = true;
      } else if (!isDefault) {
        config.default = false;
      }
    }

    await config.save();

    const result = config.toObject();
    result.apiKey = result.apiKey ? maskKey(result.apiKey) : null;
    result.configured = !!config.apiKey;

    await audit(req, "AI_PROVIDER_UPDATED", config._id, {
      provider: config.provider,
      model: config.model,
      enabled: config.enabled,
      default: config.default,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /admin/v1/ai-configs/:id
export const deleteAIConfig = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId || req.user?.organizationId;
    const { id } = req.params;

    const config = await AIConfig.findById(id);
    if (!config) {
      return res.status(404).json({ success: false, message: "AIConfig not found" });
    }

    // Verify organization ownership
    if (config.organization_id.toString() !== orgId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden: Cannot access other organization settings" });
    }

    await AIConfig.findByIdAndDelete(id);
    await audit(req, "AI_PROVIDER_DELETED", id, null, {
      provider: config.provider,
      model: config.model,
    });
    res.status(200).json({ success: true, message: "AIConfig deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
