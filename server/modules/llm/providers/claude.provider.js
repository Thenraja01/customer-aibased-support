import { LLMProvider } from "./base.provider.js";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

export class ClaudeProvider extends LLMProvider {
  name = "claude";

  constructor() {
    super();
    this.modelName = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
  }

  isAvailable() {
    return true;
  }

  _apiKey(options = {}) {
    return options.apiKey || options.api_key || options.claude_api_key || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  }

  async _call(messages, options, maxTokens) {
    const res = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this._apiKey(options),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: options.model || this.modelName,
        messages,
        max_tokens: maxTokens,
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 0.95,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Claude API error (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    return (data.content || []).map((block) => block.text || "").join("");
  }

  // ── Health Check ─────────────────────────────────────────────────

  async healthCheck(options = {}) {
    if (!this._apiKey(options)) {
      return {
        provider: "claude",
        status: "unconfigured",
        latencyMs: 0,
        model: this.modelName,
        error: "ANTHROPIC_API_KEY / CLAUDE_API_KEY is not configured",
      };
    }

    const start = Date.now();
    try {
      const text = await this._call([{ role: "user", content: "ping" }], options, 5);
      return {
        provider: "claude",
        status: text ? "healthy" : "degraded",
        latencyMs: Date.now() - start,
        model: options.model || this.modelName,
      };
    } catch (err) {
      return {
        provider: "claude",
        status: "unhealthy",
        latencyMs: Date.now() - start,
        model: options.model || this.modelName,
        error: err.message,
      };
    }
  }

  async generate(prompt, options = {}) {
    if (!this._apiKey(options)) {
      console.warn("[ClaudeProvider] No API key available for request");
      return null;
    }

    try {
      return await this._call([{ role: "user", content: prompt }], options, options.maxTokens ?? 2048);
    } catch (err) {
      console.error(`[ClaudeProvider] API error:`, err.message);
      return null;
    }
  }
}