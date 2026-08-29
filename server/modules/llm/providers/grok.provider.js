import { LLMProvider } from "./base.provider.js";

const GROK_API_URL = "https://api.x.ai/v1/chat/completions";

/**
 * xAI Grok provider — OpenAI-compatible chat completions API.
 *
 * Uses an XAI_API_KEY / GROK_API_KEY and any grok-* model id.
 * Implemented with native fetch (no extra SDK dependency).
 */
export class GrokProvider extends LLMProvider {
  name = "grok";

  constructor() {
    super();
    this.modelName = process.env.GROK_MODEL || "grok-3-mini";
  }

  isAvailable() {
    return true; // checked request-time based on options.apiKey or env
  }

  _apiKey(options = {}) {
    return options.apiKey || options.api_key || options.grok_api_key || process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  }

  async _call(messages, options, maxTokens) {
    const res = await fetch(GROK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this._apiKey(options)}`,
      },
      body: JSON.stringify({
        model: options.model || this.modelName,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: maxTokens,
        top_p: options.topP ?? 0.95,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Grok API error (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  // ── Health Check ─────────────────────────────────────────────────

  async healthCheck(options = {}) {
    if (!this._apiKey(options)) {
      return {
        provider: "grok",
        status: "unconfigured",
        latencyMs: 0,
        model: this.modelName,
        error: "GROK_API_KEY / XAI_API_KEY is not configured",
      };
    }

    const start = Date.now();
    try {
      const text = await this._call(
        [{ role: "user", content: "ping" }],
        options,
        5
      );
      return {
        provider: "grok",
        status: text ? "healthy" : "degraded",
        latencyMs: Date.now() - start,
        model: options.model || this.modelName,
      };
    } catch (err) {
      return {
        provider: "grok",
        status: "unhealthy",
        latencyMs: Date.now() - start,
        model: options.model || this.modelName,
        error: err.message,
      };
    }
  }

  async generate(prompt, options = {}) {
    if (!this._apiKey(options)) {
      const err = new Error("No API key configured for Grok");
      err.status = 401;
      throw err;
    }

    try {
      return await this._call([{ role: "user", content: prompt }], options, options.maxTokens ?? 2048);
    } catch (err) {
      console.error(`[GrokProvider] API error:`, err.message);
      throw err;
    }
  }
}