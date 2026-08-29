import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMProvider } from "./base.provider.js";

let client = null;

export class GeminiProvider extends LLMProvider {
  name = "gemini";

  constructor() {
    super();
    this.modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  }

  isAvailable() {
    return true; // availability is checked request-time based on options.apiKey or env.GEMINI_API_KEY
  }

  _apiKey(options = {}) {
    return options.apiKey || options.api_key || options.gemini_api_key || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  }

  // ── Health Check ─────────────────────────────────────────────────

  async healthCheck(options = {}) {
    const apiKey = this._apiKey(options);
    if (!apiKey) {
      return {
        provider: "gemini",
        status: "unconfigured",
        latencyMs: 0,
        model: this.modelName,
        error: "GEMINI_API_KEY is not configured",
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
        provider: "gemini",
        status: text ? "healthy" : "degraded",
        latencyMs: Date.now() - start,
        model: options.model || this.modelName,
      };
    } catch (err) {
      return {
        provider: "gemini",
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
      const err = new Error("No API key configured for Gemini");
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
      console.error(`[GeminiProvider] API error (${modelName}):`, err.message);
      throw err;
    }
  }
}
