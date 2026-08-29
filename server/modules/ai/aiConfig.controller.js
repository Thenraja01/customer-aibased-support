import AIConfig from "./schemas/aiConfig.schema.js";
import Organization from "../organization/organization.schema.js";
import { encrypt, decrypt } from "../../utils/crypto.utils.js";
import { testProviderConnection } from "../llm/index.js";
import { globalCircuitBreaker } from "../llm/circuitBreaker.js";
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

const orgIdFrom = (req) => {
  const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";
  if (isSuperAdmin && (req.query?.orgId || req.body?.orgId || req.query?.organizationId || req.body?.organizationId)) {
    return req.query?.orgId || req.body?.orgId || req.query?.organizationId || req.body?.organizationId;
  }
  return req.scope?.organizationId || req.user?.organizationId;
};

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
    const start = Date.now();
    const result = await testProviderConnection({
      provider: config.provider,
      apiKey,
      model: config.model,
      baseUrl: config.configuration?.base_url,
    });
    const latencyMs = Date.now() - start;

    // Reset circuit breaker on successful connection
    if (result.status === "healthy" || result.status === "degraded") {
      globalCircuitBreaker.reset(orgId, config.provider, config.model);
    }

    await audit(req, "AI_PROVIDER_TESTED", config._id, { status: result.status, latencyMs });

    res.status(200).json({
      success: true,
      data: {
        ...result,
        latencyMs: result.latencyMs || latencyMs,
      },
    });
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

    const org = await Organization.findById(orgId).select("llm_config").lean();
    const maxFallbacks = org?.llm_config?.max_fallbacks ?? 1;

    const configs = await AIConfig.find({ organization_id: orgId })
      .sort({ priority: 1, created_at: 1 })
      .lean();

    // Attach circuit breaker live status to each model
    const sanitizedConfigs = configs.map((c) => {
      const cbStatus = globalCircuitBreaker.getStatus(orgId, c.provider, c.model);
      return {
        ...c,
        apiKey: c.apiKey ? maskKey(c.apiKey) : null,
        configured: !!c.apiKey || c.provider === "ollama",
        circuitBreaker: {
          state: cbStatus.state,
          consecutiveFailures: cbStatus.consecutiveFailures,
          totalFailures: cbStatus.totalFailures,
          remainingCooldownMs: cbStatus.remainingCooldownMs,
          isAvailable: cbStatus.isAvailable,
          lastFailureReason: cbStatus.lastFailureReason,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: sanitizedConfigs,
      maxFallbacks,
    });
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

    const { provider, model, display_name, enabled, default: isDefault, priority, apiKey, configuration, usage_limits } = req.body;

    if (!provider || !model || !display_name) {
      return res.status(400).json({ success: false, message: "provider, model, and display_name are required" });
    }

    const encryptedKey = apiKey ? encrypt(apiKey) : null;

    // Calculate priority if not supplied
    let assignPriority = priority;
    if (assignPriority === undefined || assignPriority === null) {
      const count = await AIConfig.countDocuments({ organization_id: orgId });
      assignPriority = count + 1;
    }

    if (isDefault) {
      await AIConfig.updateMany({ organization_id: orgId }, { default: false });
    }

    const config = await AIConfig.create({
      organization_id: orgId,
      provider: provider.toLowerCase(),
      model,
      display_name,
      enabled: enabled !== false,
      default: isDefault === true,
      priority: assignPriority,
      apiKey: encryptedKey,
      configuration: configuration || {},
      usage_limits: usage_limits || {},
    });

    const result = config.toObject();
    result.apiKey = result.apiKey ? maskKey(result.apiKey) : null;
    result.configured = !!encryptedKey || provider === "ollama";

    await audit(req, "AI_PROVIDER_CREATED", config._id, { provider, model, display_name, priority: assignPriority });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /admin/v1/ai-configs/:id
export const updateAIConfig = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";
    const orgId = orgIdFrom(req);
    const { id } = req.params;

    const config = await AIConfig.findById(id);
    if (!config) {
      return res.status(404).json({ success: false, message: "AIConfig not found" });
    }

    if (!isSuperAdmin && orgId && config.organization_id.toString() !== orgId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden: Cannot access other organization settings" });
    }

    const { provider, model, display_name, enabled, default: isDefault, priority, apiKey, configuration, usage_limits } = req.body;

    if (provider) config.provider = provider.toLowerCase();
    if (model) config.model = model;
    if (display_name) config.display_name = display_name;
    if (enabled !== undefined) config.enabled = enabled;
    if (priority !== undefined) config.priority = priority;
    if (configuration) config.configuration = { ...config.configuration, ...configuration };
    if (usage_limits) config.usage_limits = { ...config.usage_limits, ...usage_limits };

    if (apiKey !== undefined) {
      if (apiKey === null || apiKey === "") {
        config.apiKey = null;
      } else if (!apiKey.startsWith("****")) {
        config.apiKey = encrypt(apiKey);
      }
    }

    if (isDefault !== undefined) {
      if (isDefault && !config.default) {
        await AIConfig.updateMany({ organization_id: config.organization_id }, { default: false });
        config.default = true;
      } else if (!isDefault) {
        config.default = false;
      }
    }

    await config.save();

    const result = config.toObject();
    result.apiKey = result.apiKey ? maskKey(result.apiKey) : null;
    result.configured = !!config.apiKey || config.provider === "ollama";

    await audit(req, "AI_PROVIDER_UPDATED", config._id, {
      provider: config.provider,
      model: config.model,
      enabled: config.enabled,
      default: config.default,
      priority: config.priority,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /admin/v1/ai-configs/:id/set-default
export const setDefaultModel = async (req, res) => {
  try {
    const orgId = orgIdFrom(req);
    const { id } = req.params;

    const config = await AIConfig.findById(id);
    if (!config) {
      return res.status(404).json({ success: false, message: "AIConfig not found" });
    }

    if (orgId && config.organization_id.toString() !== orgId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Unset all other defaults in this organization
    await AIConfig.updateMany({ organization_id: config.organization_id }, { default: false });

    // Set this config as default and priority 1
    config.default = true;
    config.enabled = true;
    config.priority = 1;
    await config.save();

    // Also sync to Organization.llm_config for backward compatibility
    await Organization.findByIdAndUpdate(config.organization_id, {
      "llm_config.provider": config.provider,
      "llm_config.model": config.model,
      "llm_config.model_name": config.model,
    });

    await audit(req, "AI_DEFAULT_MODEL_CHANGED", config._id, {
      provider: config.provider,
      model: config.model,
    });

    res.status(200).json({
      success: true,
      message: `Default model updated to ${config.display_name} (${config.provider}/${config.model})`,
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /admin/v1/ai-configs/reorder
export const reorderPriorities = async (req, res) => {
  try {
    const orgId = orgIdFrom(req);
    const { order } = req.body; // Array of { id, priority }

    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: "order must be an array of { id, priority }" });
    }

    const bulkOps = order.map((item) => ({
      updateOne: {
        filter: { _id: item.id, organization_id: orgId },
        update: { $set: { priority: item.priority } },
      },
    }));

    if (bulkOps.length > 0) {
      await AIConfig.bulkWrite(bulkOps);
    }

    await audit(req, "AI_MODELS_REORDERED", orgId, { count: order.length });

    res.status(200).json({ success: true, message: "Model priorities updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /admin/v1/ai-configs/:id/reset-circuit
export const resetCircuitBreaker = async (req, res) => {
  try {
    const orgId = orgIdFrom(req);
    const { id } = req.params;

    const config = await AIConfig.findById(id);
    if (!config) {
      return res.status(404).json({ success: false, message: "AIConfig not found" });
    }

    globalCircuitBreaker.reset(orgId, config.provider, config.model);

    res.status(200).json({
      success: true,
      message: `Circuit breaker reset for ${config.provider}/${config.model}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /admin/v1/ai-configs/:id
export const deleteAIConfig = async (req, res) => {
  try {
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";
    const orgId = orgIdFrom(req);
    const { id } = req.params;

    const config = await AIConfig.findById(id);
    if (!config) {
      return res.status(404).json({ success: false, message: "AIConfig not found" });
    }

    if (!isSuperAdmin && orgId && config.organization_id.toString() !== orgId.toString()) {
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
