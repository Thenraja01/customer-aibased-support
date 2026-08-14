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

  // ── Health Check ─────────────────────────────────────────────────

  async healthCheck(options = {}) {
    const apiKey = options.apiKey || process.env.GROQ_API_KEY;
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
    const apiKey = options.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("[GroqProvider] No API key available for request");
      return null;
    }

    const modelName = options.model || this.modelName;

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
      console.error(`[GroqProvider] API error:`, err.message);
      return null;
    }
  }
}
