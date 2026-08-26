import Groq from "groq-sdk";
import { LLMProvider } from "./base.provider.js";

let client = null;

export class GroqProvider extends LLMProvider {
  name = "groq";

  constructor() {
    super();
    this.modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  }

  isAvailable() {
    return true; // checked request-time based on options.apiKey or env.GROQ_API_KEY
  }

  _apiKey(options = {}) {
    return options.apiKey || options.api_key || options.groq_api_key || process.env.GROQ_API_KEY;
  }

  // ── Health Check ─────────────────────────────────────────────────

  async healthCheck(options = {}) {
    const apiKey = this._apiKey(options);
    if (!apiKey) {
      return {
        provider: "groq",
        status: "unconfigured",
        latencyMs: 0,
        model: this.modelName,
        error: "GROQ_API_KEY is not configured",
      };
    }

    const start = Date.now();
    try {
      const groqClient = new Groq({ apiKey });
      const modelName = options.model || this.modelName;
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: "user", content: "ping" }],
        model: modelName,
        max_tokens: 5,
      });
      const text = completion.choices[0]?.message?.content;
      return {
        provider: "groq",
        status: text ? "healthy" : "degraded",
        latencyMs: Date.now() - start,
        model: modelName,
      };
    } catch (err) {
      return {
        provider: "groq",
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
      console.warn("[GroqProvider] No API key available for request");
      return null;
    }

    let modelName = options.model || this.modelName;
    if (!modelName || modelName.startsWith("qwen/") || modelName.includes("invalid") || modelName.includes("qwen3.6")) {
      modelName = "llama-3.3-70b-versatile";
    }

    try {
      const groqClient = new Groq({ apiKey });
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: modelName,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        top_p: options.topP ?? 0.95,
      });
      return completion.choices[0]?.message?.content || "";
    } catch (err) {
      console.error(`[GroqProvider] API error (${modelName}):`, err.message);
      // Fallback model retry for Groq if requested model is 404 / deprecated
      if (err.message?.includes("model_not_found") || err.status === 404) {
        const fallbackModels = ["llama-3.1-8b-instant", "llama3-8b-8192", "mixtral-8x7b-32768"];
        for (const fbModel of fallbackModels) {
          if (fbModel === modelName) continue;
          try {
            console.log(`[GroqProvider] Retrying with fallback model "${fbModel}"...`);
            const groqClient = new Groq({ apiKey });
            const completion = await groqClient.chat.completions.create({
              messages: [{ role: "user", content: prompt }],
              model: fbModel,
              temperature: options.temperature ?? 0.7,
              max_tokens: options.maxTokens ?? 2048,
              top_p: options.topP ?? 0.95,
            });
            const text = completion.choices[0]?.message?.content;
            if (text) return text;
          } catch {
            /* try next fallback model */
          }
        }
      }
      return null;
    }
  }
}
