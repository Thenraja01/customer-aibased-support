import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMProvider } from "./base.provider.js";

export class GoogleProvider extends LLMProvider {
  name = "google";

  constructor() {
    super();
    this.modelName = process.env.GOOGLE_MODEL || "gemini-2.0-flash";
  }

  isAvailable() {
    return true; // checked request-time based on options.apiKey or env.GOOGLE_API_KEY
  }

  _apiKey(options = {}) {
    return options.apiKey || options.api_key || options.gemini_api_key || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  }

  // ── Health Check ─────────────────────────────────────────────────

  async healthCheck(options = {}) {
    const apiKey = this._apiKey(options);
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
    const apiKey = this._apiKey(options);
    if (!apiKey) {
      const err = new Error("No API key configured for Google");
      err.status = 401;
      throw err;
    }

    let modelName = options.model || this.modelName;
    if (!modelName || !modelName.startsWith("gemini-") || modelName.includes("llama")) {
      modelName = "gemini-1.5-flash";
    }

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
      console.error(`[GoogleProvider] API error (${modelName}):`, err.message);
      throw err;
    }
  }
}
