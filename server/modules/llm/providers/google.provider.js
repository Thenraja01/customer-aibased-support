import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMProvider } from "./base.provider.js";

/**
 * Google AI (Gemini) provider — "google" provider id.
 *
 * Uses Google AI Studio keys (GOOGLE_API_KEY). The legacy `gemini` provider id
 * is kept for backwards compatibility; `google` is the canonical, production
 * name surfaced in the AI Config settings.
 */
export class GoogleProvider extends LLMProvider {
  name = "google";

  constructor() {
    super();
    this.modelName = process.env.GOOGLE_MODEL || "gemini-2.0-flash";
  }

  isAvailable() {
    return true; // checked request-time based on options.apiKey or env.GOOGLE_API_KEY
  }

  // ── Health Check ─────────────────────────────────────────────────

  async healthCheck(options = {}) {
    const apiKey = options.apiKey || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return {
        provider: "google",
        status: "unconfigured",
        latencyMs: 0,
        model: this.modelName,
        error: "GOOGLE_API_KEY is not configured",
      };
    }

    const start = Date.now();
    try {
      const googleAI = new GoogleGenerativeAI(apiKey);
      const model = googleAI.getGenerativeModel({ model: options.model || this.modelName });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
        generationConfig: { maxOutputTokens: 5 },
      });
      const text = result?.response?.text();
      return {
        provider: "google",
        status: text ? "healthy" : "degraded",
        latencyMs: Date.now() - start,
        model: options.model || this.modelName,
      };
    } catch (err) {
      return {
        provider: "google",
        status: "unhealthy",
        latencyMs: Date.now() - start,
        model: options.model || this.modelName,
        error: err.message,
      };
    }
  }

  async generate(prompt, options = {}) {
    const apiKey = options.apiKey || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn("[GoogleProvider] No API key available for request");
      return null;
    }

    const modelName = options.model || this.modelName;

    try {
      const googleAI = new GoogleGenerativeAI(apiKey);
      const model = googleAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 2048,
          topP: options.topP ?? 0.95,
        },
      });
      return result.response.text();
    } catch (err) {
      console.error(`[GoogleProvider] API error:`, err.message);
      return null;
    }
  }
}
