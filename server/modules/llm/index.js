import env from "../../config/env.js";
import { GeminiProvider } from "./providers/gemini.provider.js";
import { GroqProvider } from "./providers/groq.provider.js";
import { OllamaProvider } from "./providers/ollama.provider.js";
import { GoogleProvider } from "./providers/google.provider.js";
import { GrokProvider } from "./providers/grok.provider.js";
import { ClaudeProvider } from "./providers/claude.provider.js";
import { FallbackProvider } from "./providers/fallback.provider.js";
import { checkOutputGuardrails } from "../chat/guardrails.service.js";

const providers = [
  new OllamaProvider(),
  new GeminiProvider(),
  new GroqProvider(),
  new GoogleProvider(),
  new GrokProvider(),
  new ClaudeProvider(),
  new FallbackProvider(),
];

const preferredName = (env.LLM_PROVIDER || "ollama").toLowerCase();

// ── Thinking-tag cleanup (BUG FIX: correct regex) ────────────────────
// Removes <thinking>...</thinking> blocks that some models output before their answer.
const cleanResponse = (text) => {
  if (!text) return "";
  // BUG FIX: was `/ thinking [\s\S]*?<\thinking/gi` — space prefix and wrong tag
  text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
  // Also strip standalone opening tags if model didn't close them
  text = text.replace(/<thinking>[\s\S]*/gi, "");
  text = text.replace(/^[\s\r\n]+/, "").trim();
  return text;
};

// ── LLM generation with provider fallback chain ───────────────────────

export const generateResponse = async (prompt, userMessage, options = {}) => {
  const { organizationId, temperature, maxTokens, provider: customProvider } = options;

  const activeProvider = (customProvider || preferredName).toLowerCase();

  const preferred = providers.find(
    (p) => p.name === activeProvider && p.isAvailable?.() !== false
  );
  const others = providers.filter((p) => p !== preferred && p.name !== "fallback");
  const fallback = providers.find((p) => p.name === "fallback");

  const chain = preferred ? [preferred, ...others, fallback] : [...others, fallback];

  console.log(
    `[LLM] generateResponse | preferred=${activeProvider} | chain=[${chain.map((p) => p.name).join(", ")}] | temp=${temperature ?? 0.7} | maxTokens=${maxTokens ?? 2048}`
  );

  const startedAt = Date.now();
  let rawResponse = null;
  let usedProvider = null;

  for (const provider of chain) {
    if (!provider) continue;
    if (provider.isAvailable && !provider.isAvailable()) {
      console.log(`[LLM] Skipping provider "${provider.name}": unavailable`);
      continue;
    }

    try {
      const providerStart = Date.now();
      const result = await provider.generate(prompt, { ...options, userMessage });
      const elapsed = Date.now() - providerStart;
      const preview = result == null
        ? "NULL"
        : `"${String(result).slice(0, 80)}${String(result).length > 80 ? "…" : ""}"`;
      console.log(`[LLM] Provider "${provider.name}" returned ${preview} in ${elapsed}ms`);

      if (result !== null && result !== undefined && String(result).trim().length > 0) {
        rawResponse = String(result);
        usedProvider = provider.name;
        break;
      }
    } catch (err) {
      console.error(`[LLM] Provider "${provider.name}" threw:`, err.message);
    }
  }

  console.log(
    `[LLM] Total generation time: ${Date.now() - startedAt}ms | usedProvider=${usedProvider} | rawLength=${rawResponse?.length ?? 0}`
  );

  if (!rawResponse || rawResponse.trim().length === 0) {
    return {
      text: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
      provider: "fallback",
    };
  }

  // Clean thinking tags from the raw response
  let cleaned = cleanResponse(rawResponse);

  // Apply output guardrails
  if (organizationId) {
    try {
      const guardrailResult = await checkOutputGuardrails(cleaned, organizationId);
      if (guardrailResult.sanitized && guardrailResult.sanitized.trim().length > 0) {
        // BUG FIX: check that sanitized isn't just [REDACTED] tokens
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

  return { text: cleaned, provider: usedProvider };
};

// ── Health Check Exports ─────────────────────────────────────────────────

export const getActiveProvider = () => {
  return preferredName;
};

// The model name of the currently preferred provider (e.g. "llama3.2:3b" for
// ollama, "gemini-2.0-flash" for gemini). Falls back to the configured
// LLM_MODEL so callers never display a stale hardcoded model.
export const getActiveModel = () => {
  const provider = providers.find((p) => p.name === preferredName);
  return provider?.modelName || env.LLM_MODEL || "llama3.2:3b";
};

export const healthCheck = async () => {
  const results = await Promise.all(
    providers
      .filter((p) => p.name !== "fallback")
      .map(async (p) => {
        if (typeof p.healthCheck === "function") {
          return await p.healthCheck();
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
 * Used by the admin AI Config panel to validate a stored key before saving.
 */
export const testProviderConnection = async ({ provider, apiKey, model }) => {
  const target = providers.find((p) => p.name === (provider || "").toLowerCase());
  if (!target || typeof target.healthCheck !== "function") {
    return {
      provider: provider || "unknown",
      status: "unknown",
      error: `Provider "${provider}" is not supported`,
    };
  }
  return target.healthCheck({ apiKey, model });
};
