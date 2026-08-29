import Groq from "groq-sdk";
import { LLMProvider } from "./base.provider.js";

const VALID_GROQ_MODELS = [
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
  "groq/compound",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

const stripThinking = (text) => {
  if (!text) return "";
  return text
    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "")
    .replace(/^[\s\S]*?<\/think(?:ing)?>/i, "")
    .trim();
};

export class GroqProvider extends LLMProvider {
  name = "groq";

  constructor() {
    super();
    this.modelName = process.env.GROQ_MODEL || "qwen/qwen3.6-27b";
  }

  isAvailable() {
    return true; // checked request-time based on options.apiKey or env.GROQ_API_KEY
  }

  _apiKey(options = {}) {
    return options.apiKey || options.api_key || options.groq_api_key || process.env.GROQ_API_KEY;
  }

  async testConnection(options = {}) {
    const apiKey = this._apiKey(options);
    if (!apiKey) return { ok: false, error: "No API key configured for Groq" };

    try {
      const groqClient = new Groq({ apiKey });
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: "user", content: "Hi" }],
        model: this.modelName || "qwen/qwen3.6-27b",
        max_tokens: 10,
      });
      return { ok: true, model: this.modelName, latency: 0 };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async generate(prompt, options = {}) {
    const apiKey = this._apiKey(options);
    if (!apiKey) {
      const err = new Error("No API key configured for Groq");
      err.status = 401;
      throw err;
    }

    let modelName = options.model || this.modelName;
    if (!modelName || !VALID_GROQ_MODELS.includes(modelName)) {
      modelName = "llama-3.3-70b-versatile";
    }

    const effectiveMaxTokens = Math.max(options.maxTokens || 2048, 2048);

    try {
      const groqClient = new Groq({ apiKey });
      const completion = await groqClient.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: modelName,
        temperature: options.temperature ?? 0.7,
        max_tokens: effectiveMaxTokens,
        top_p: options.topP ?? 0.95,
      });
      const raw = completion.choices[0]?.message?.content || "";
      return stripThinking(raw);
    } catch (err) {
      console.error(`[GroqProvider] API error (${modelName}):`, err.message);
      throw err;
    }
  }
}
