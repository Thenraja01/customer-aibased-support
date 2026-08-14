import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMProvider } from "./base.provider.js";

let client = null;

export class GeminiProvider extends LLMProvider {
  name = "gemini";

  constructor() {
    super();
    this.modelName = process.env.LLM_MODEL || "gemini-2.0-flash";
  }

  isAvailable() {
    return true; // availability is checked request-time based on options.apiKey or env.GEMINI_API_KEY
  }

  // ── Health Check ─────────────────────────────────────────────────

  async healthCheck(options = {}) {
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
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
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[GeminiProvider] No API key available for request");
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
      console.error(`[GeminiProvider] API error:`, err.message);
      return null;
    }
  }
}
