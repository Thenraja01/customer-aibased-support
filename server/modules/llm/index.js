import env from "../../config/env.js";
import { GeminiProvider } from "./providers/gemini.provider.js";
import { GroqProvider } from "./providers/groq.provider.js";
import { OllamaProvider } from "./providers/ollama.provider.js";
import { GoogleProvider } from "./providers/google.provider.js";
import { GrokProvider } from "./providers/grok.provider.js";
import { ClaudeProvider } from "./providers/claude.provider.js";
import { FallbackProvider } from "./providers/fallback.provider.js";
import { checkOutputGuardrails } from "../chat/guardrails.service.js";
import Organization from "../organization/organization.schema.js";
import Branch from "../branch/branch.schema.js";
import AIConfig from "../ai/schemas/aiConfig.schema.js";
import { classifyLLMError, FailureCategory } from "./failureClassifier.js";
import { globalCircuitBreaker, CircuitState } from "./circuitBreaker.js";
import { logLLMAttempt } from "./llmLogger.js";
import { decrypt } from "../../utils/crypto.utils.js";

const providerInstances = [
  new GroqProvider(),
  new GeminiProvider(),
  new OllamaProvider(),
  new GoogleProvider(),
  new GrokProvider(),
  new ClaudeProvider(),
  new FallbackProvider(),
];

const getProviderInstance = (name) => {
  const norm = (name || "").toLowerCase();
  return providerInstances.find((p) => p.name === norm) || null;
};

let preferredName = (env.LLM_PROVIDER || "groq").toLowerCase();

// ── Thinking-tag cleanup (Handles both <think> and <thinking>) ──────────
export const cleanResponse = (text) => {
  if (!text) return "";
  let cleaned = text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "");
  cleaned = cleaned.replace(/^[\s\S]*?<\/think(?:ing)?>/i, "");
  cleaned = cleaned.replace(/<think(?:ing)?>[\s\S]*/gi, "");
  return cleaned.trim();
};

/**
 * Resolves the priority-ordered list of models and default model for an organization.
 */
export const resolveTenantModelPlan = async (organizationId, branchId, customOptions = {}) => {
  let org = null;
  let branch = null;

  if (branchId) {
    branch = await Branch.findById(branchId).lean().catch(() => null);
  }
  if (organizationId) {
    org = await Organization.findById(organizationId).lean().catch(() => null);
  }

  const maxFallbacks = org?.llm_config?.max_fallbacks ?? 1;

  // 1. Try resolving priority models from AIConfig collection
  let aiConfigs = [];
  if (organizationId) {
    aiConfigs = await AIConfig.find({ organization_id: organizationId, enabled: true })
      .sort({ priority: 1, created_at: 1 })
      .lean()
      .catch(() => []);
  }

  let modelPlan = [];

  if (aiConfigs && aiConfigs.length > 0) {
    modelPlan = aiConfigs.map((cfg, idx) => ({
      provider: cfg.provider.toLowerCase(),
      model: cfg.model,
      displayName: cfg.display_name,
      apiKey: cfg.apiKey ? decrypt(cfg.apiKey) : null,
      isDefault: cfg.default === true || idx === 0,
      priority: cfg.priority || idx + 1,
      configuration: cfg.configuration || {},
      organizationId,
    }));

    // Ensure only one default model is marked (or the first entry)
    const defaultIdx = modelPlan.findIndex((m) => m.isDefault);
    if (defaultIdx === -1 && modelPlan.length > 0) {
      modelPlan[0].isDefault = true;
    }
  } else {
    // 2. Fallback to Organization / Branch llm_config or Environment
    const dbConfig = branch?.llm_config?.provider ? branch.llm_config : org?.llm_config;
    const primaryProv = (customOptions.provider || dbConfig?.provider || preferredName || "ollama").toLowerCase();
    const primaryModel =
      customOptions.model ||
      dbConfig?.model ||
      dbConfig?.model_name ||
      (primaryProv === "ollama" ? "llama3.2:3b" : primaryProv === "groq" ? "llama-3.1-8b-instant" : "gemini-1.5-flash");
    const primaryKey = customOptions.apiKey || dbConfig?.api_key || dbConfig?.[`${primaryProv}_api_key`] || null;

    modelPlan.push({
      provider: primaryProv,
      model: primaryModel,
      displayName: `${primaryProv} (${primaryModel})`,
      apiKey: primaryKey,
      isDefault: true,
      priority: 1,
      configuration: dbConfig || {},
      organizationId,
    });

    // Add secondary available providers as backup candidates
    const backupCandidates = ["ollama", "groq", "gemini", "claude"]
      .filter((p) => p !== primaryProv)
      .map((p, idx) => ({
        provider: p,
        model: p === "ollama" ? "llama3.2:3b" : p === "groq" ? "llama-3.1-8b-instant" : "gemini-1.5-flash",
        displayName: `${p} Backup`,
        apiKey: dbConfig?.[`${p}_api_key`] || null,
        isDefault: false,
        priority: idx + 2,
        configuration: {},
        organizationId,
      }));

    modelPlan.push(...backupCandidates);
  }

  // Sort model plan: default model first, then local Ollama / configured keys, then unconfigured
  const defaultEntry = modelPlan.find((m) => m.isDefault) || modelPlan[0];
  const otherEntries = modelPlan
    .filter((m) => m !== defaultEntry)
    .sort((a, b) => {
      // Prioritize ollama (no key needed) or models with keys over empty keys
      const aReady = a.provider === "ollama" || Boolean(a.apiKey);
      const bReady = b.provider === "ollama" || Boolean(b.apiKey);
      if (aReady && !bReady) return -1;
      if (!aReady && bReady) return 1;
      return (a.priority || 0) - (b.priority || 0);
    });

  return {
    defaultModel: defaultEntry,
    orderedChain: [defaultEntry, ...otherEntries],
    maxFallbacks,
  };
};

/**
 * ── LLM Generation with Controlled Failover & Centralized Error Classification ──
 *
 * CRITICAL RULE:
 * A slow model is NOT a failed model.
 * The default model owns the request until it genuinely fails.
 * Fallback is only invoked if a genuine, classified provider failure occurs.
 */
export const generateResponse = async (prompt, userMessage, options = {}) => {
  const { organizationId, branchId, temperature, maxTokens } = options;
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // 1. Resolve tenant model hierarchy
  const { defaultModel, orderedChain, maxFallbacks } = await resolveTenantModelPlan(
    organizationId,
    branchId,
    options
  );

  console.log(
    `[LLM] generateResponse [${requestId}] | org=${organizationId || 'global'} | default=${defaultModel.provider}/${defaultModel.model} | maxFallbacks=${maxFallbacks} | chain=[${orderedChain.map((m) => `${m.provider}:${m.model}`).join(", ")}]`
  );

  let rawResponse = null;
  let successfulProvider = null;
  let successfulModel = null;
  let attemptsCount = 0;
  let failoverOccurred = false;
  let lastFailureInfo = null;

  // Maximum allowed provider attempts = 1 (Default) + maxFallbacks
  const maxAttemptsAllowed = Math.min(1 + maxFallbacks, orderedChain.length);

  for (let i = 0; i < maxAttemptsAllowed; i++) {
    const candidate = orderedChain[i];
    if (!candidate) continue;

    const isDefault = candidate === defaultModel;
    const isFallback = !isDefault;
    const providerInstance = getProviderInstance(candidate.provider);

    if (!providerInstance) {
      console.warn(`[LLM] Provider instance "${candidate.provider}" not found. Skipping.`);
      continue;
    }

    // 2. Check Circuit Breaker State (tenant + provider + model)
    const canRun = globalCircuitBreaker.canExecute(organizationId, candidate.provider, candidate.model);
    if (!canRun) {
      logLLMAttempt({
        requestId,
        organizationId,
        provider: candidate.provider,
        model: candidate.model,
        attempt: attemptsCount + 1,
        isDefault,
        isFallback,
        status: "SKIPPED_CIRCUIT_OPEN",
        errorType: "CIRCUIT_BREAKER_OPEN",
        errorMessage: "Circuit is OPEN due to recent consecutive failures. Skipping during cooldown.",
      });
      continue;
    }

    attemptsCount += 1;
    const attemptStart = Date.now();

    const mergedOptions = {
      ...candidate.configuration,
      ...options,
      apiKey: candidate.apiKey || options.apiKey,
      model: candidate.model || options.model,
      temperature: temperature ?? candidate.configuration?.temperature ?? 0.7,
      maxTokens: maxTokens ?? candidate.configuration?.max_tokens ?? 2048,
      userMessage,
      requestId,
    };

    try {
      // 3. Execute Model (Allow natural execution time without artificial timeouts!)
      const result = await providerInstance.generate(prompt, mergedOptions);
      const elapsed = Date.now() - attemptStart;

      if (result !== null && result !== undefined && String(result).trim().length > 0) {
        rawResponse = String(result);
        successfulProvider = candidate.provider;
        successfulModel = candidate.model;

        // Record Circuit Breaker Success
        globalCircuitBreaker.recordSuccess(organizationId, candidate.provider, candidate.model);

        logLLMAttempt({
          requestId,
          organizationId,
          provider: candidate.provider,
          model: candidate.model,
          attempt: attemptsCount,
          isDefault,
          isFallback,
          status: "SUCCESS",
          latencyMs: elapsed,
        });

        if (isFallback) {
          failoverOccurred = true;
        }
        break; // Successful response received. Stop!
      } else {
        throw new Error(`Provider returned empty response`);
      }
    } catch (err) {
      const elapsed = Date.now() - attemptStart;
      const classified = classifyLLMError(err, { provider: candidate.provider, model: candidate.model });

      // Record failure on Circuit Breaker
      globalCircuitBreaker.recordFailure(organizationId, candidate.provider, candidate.model, classified);

      lastFailureInfo = {
        provider: candidate.provider,
        model: candidate.model,
        isDefault,
        error: classified.message,
        category: classified.category,
        status: classified.status,
      };

      logLLMAttempt({
        requestId,
        organizationId,
        provider: candidate.provider,
        model: candidate.model,
        attempt: attemptsCount,
        isDefault,
        isFallback,
        status: "FAILED",
        errorType: classified.category,
        errorMessage: classified.message,
        latencyMs: elapsed,
      });

      // If error is NOT failover-worthy (e.g. client cancelled), stop immediately
      if (!classified.isFailoverWorthy) {
        console.log(`[LLM] Non-failover error encountered (${classified.category}). Aborting chain.`);
        break;
      }

      console.warn(`[LLM] Failover triggered: ${candidate.provider}/${candidate.model} failed (${classified.category}).`);
    }
  }

  // 4. Handle Post-Execution Notifications
  if (failoverOccurred && lastFailureInfo) {
    // Notify admin that fallback was used for this request (Default model in DB remains untouched!)
    try {
      const { notifyAdminsOnSystemError } = await import("../notification/notification.service.js");
      await notifyAdminsOnSystemError({
        organizationId: organizationId || null,
        title: "⚠️ AI Model Failover Executed",
        message: `Default model (${defaultModel.provider}/${defaultModel.model}) failed: ${lastFailureInfo.error}. Successfully served via fallback (${successfulProvider}/${successfulModel}).`,
        type: "warning",
        link: "/admin/ai-intelligence",
        metadata: {
          requestId,
          defaultProvider: defaultModel.provider,
          defaultModel: defaultModel.model,
          failureReason: lastFailureInfo.error,
          httpStatus: lastFailureInfo.status,
          fallbackProvider: successfulProvider,
          fallbackModel: successfulModel,
          fallbackResult: "SUCCESSFUL",
        },
      });
    } catch {
      // notification fallback
    }
  }

  // 5. If all allowed models failed
  if (!rawResponse || rawResponse.trim().length === 0) {
    try {
      const { notifyAdminsOnSystemError } = await import("../notification/notification.service.js");
      await notifyAdminsOnSystemError({
        organizationId: organizationId || null,
        title: "❌ All Configured AI Models Unavailable",
        message: `Default model (${defaultModel.provider}/${defaultModel.model}) and fallback limit reached. Reason: ${lastFailureInfo?.error || "All providers unreachable"}.`,
        type: "error",
        link: "/admin/ai-intelligence",
        metadata: {
          requestId,
          defaultProvider: defaultModel.provider,
          defaultModel: defaultModel.model,
          failureReason: lastFailureInfo?.error,
          httpStatus: lastFailureInfo?.status,
          fallbackResult: "EXHAUSTED",
        },
      });
    } catch {
      // notification fallback
    }

    return {
      text: "Our AI assistant is temporarily unavailable. We are connecting you with a human support agent or creating a support ticket.",
      provider: "fallback",
      isAIOffline: true,
      error: lastFailureInfo?.error || "AI service unavailable",
    };
  }

  // 6. Clean thinking tags from the raw response
  let cleaned = cleanResponse(rawResponse);

  // 7. Apply output guardrails
  if (organizationId) {
    try {
      const guardrailResult = await checkOutputGuardrails(cleaned, organizationId);
      if (guardrailResult.sanitized && guardrailResult.sanitized.trim().length > 0) {
        const isOnlyRedacted = /^(\s*\[REDACTED\]\s*)+$/.test(guardrailResult.sanitized);
        if (isOnlyRedacted) {
          cleaned = "I'm sorry, I'm unable to provide that information. Please contact support directly.";
        } else {
          cleaned = guardrailResult.sanitized;
        }
      } else {
        cleaned = "I'm sorry, I encountered an issue generating a safe response. Please try again.";
      }
    } catch {
      // Guardrail failure is non-fatal — use unchecked response
    }
  }

  return { text: cleaned, provider: successfulProvider, model: successfulModel };
};

// ── Health Check & Management Exports ───────────────────────────────────

export const setActiveProvider = (name) => {
  if (name && typeof name === "string") {
    preferredName = name.toLowerCase();
  }
};

export const getActiveProvider = (organizationId) => {
  return preferredName;
};

export const getActiveModel = () => {
  const provider = getProviderInstance(preferredName);
  return provider?.modelName || env.LLM_MODEL || "llama3.2:3b";
};

export const healthCheck = async (options = {}) => {
  const results = await Promise.all(
    providerInstances
      .filter((p) => p.name !== "fallback")
      .map(async (p) => {
        if (typeof p.healthCheck === "function") {
          const pOptions = { ...options };
          if (p.name === "groq") {
            pOptions.apiKey = options.groq_api_key || (options.provider === "groq" ? (options.apiKey || options.api_key) : undefined);
          } else if (p.name === "gemini" || p.name === "google") {
            pOptions.apiKey = options.gemini_api_key || (options.provider === p.name ? (options.apiKey || options.api_key) : undefined);
          } else if (p.name === "grok") {
            pOptions.apiKey = options.grok_api_key || (options.provider === "grok" ? (options.apiKey || options.api_key) : undefined);
          } else if (p.name === "claude") {
            pOptions.apiKey = options.claude_api_key || (options.provider === "claude" ? (options.apiKey || options.api_key) : undefined);
          } else if (options.provider === p.name) {
            pOptions.apiKey = options.apiKey || options.api_key;
          }
          if (options.provider === p.name && (options.model || options.model_name)) {
            pOptions.model = options.model || options.model_name;
          }
          return await p.healthCheck(pOptions);
        }
        return {
          provider: p.name,
          status: "unknown",
          error: "healthCheck not implemented",
        };
      })
  );
  return results;
};

/**
 * Test a single provider connection with an explicit API key + model.
 */
export const testProviderConnection = async ({ provider, apiKey, model, baseUrl }) => {
  const target = getProviderInstance(provider);
  if (!target || typeof target.healthCheck !== "function") {
    return {
      provider: provider || "unknown",
      status: "unhealthy",
      error: `Provider "${provider}" is not supported`,
    };
  }
  const result = await target.healthCheck({ apiKey, model, baseUrl });
  
  // If test was successful, reset the circuit breaker for this model
  if (result.status === "healthy" || result.status === "degraded") {
    globalCircuitBreaker.reset("global", provider, model);
  }
  
  return result;
};
