import { LLMProvider } from "./base.provider.js";
import { warmupEmbeddingModel } from "../../../services/embedding.service.js";

const GENERATE_TIMEOUT_MS = 90_000; // 90s — local LLM can be slow on first token

export class OllamaProvider extends LLMProvider {
  name = "ollama";

  #modelReady = false;
  #warmupStarted = false;

  constructor() {
    super();
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.modelName = process.env.OLLAMA_MODEL || "llama3.2:3b";

    // BUG FIX: warm up the model at construction time (server startup),
    // NOT inline during a user request. Model pulls can take minutes.
    if (process.env.OLLAMA_WARMUP_ON_START !== "false") {
      this.#startWarmup();
    }
  }

  // ── Availability ─────────────────────────────────────────────────

  isAvailable() {
    // Always attempt — we'll handle timeout/error gracefully in generate()
    return true;
  }

  // ── Health Check ─────────────────────────────────────────────────

  async healthCheck() {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timer);
      const elapsed = Date.now() - start;
      if (!res.ok) {
        return {
          provider: "ollama",
          status: "unhealthy",
          latencyMs: elapsed,
          model: this.modelName,
          error: `HTTP ${res.status}: ${res.statusText}`,
        };
      }
      const data = await res.json();
      const modelPresent = data.models?.some((m) =>
        m.name.startsWith(this.modelName.split(":")[0])
      );
      return {
        provider: "ollama",
        status: modelPresent ? "healthy" : "degraded",
        latencyMs: elapsed,
        model: this.modelName,
        details: { installedModels: data.models?.map((m) => m.name) || [] },
      };
    } catch (err) {
      return {
        provider: "ollama",
        status: "unhealthy",
        latencyMs: Date.now() - start,
        model: this.modelName,
        error: err.message,
      };
    }
  }

  // ── Background warm-up (startup only) ────────────────────────────

  #startWarmup() {
    if (this.#warmupStarted) return;
    this.#warmupStarted = true;

    // Run async — does NOT block constructor or server startup
    this.#warmup().catch((err) =>
      console.warn(`[OllamaProvider] Warm-up failed: ${err.message}`)
    );
  }

  async #warmup() {
    console.log(`[OllamaProvider] Warming up model "${this.modelName}"…`);
    try {
      const present = await this.#isModelPresent();
      if (!present) {
        console.log(`[OllamaProvider] Pulling model "${this.modelName}" in background…`);
        await this.#pullModel();
      }
      this.#modelReady = true;
      console.log(`[OllamaProvider] Model "${this.modelName}" ready.`);
    } catch (err) {
      console.warn(`[OllamaProvider] Warm-up error: ${err.message}`);
    }
  }

  // ── Model presence & pull ─────────────────────────────────────────

  async #isModelPresent() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return false;
      const data = await res.json();
      return (
        data.models?.some((m) =>
          m.name.startsWith(this.modelName.split(":")[0])
        ) ?? false
      );
    } catch {
      return false;
    }
  }

  async #pullModel() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5 * 60_000); // 5 min for pull
    try {
      const res = await fetch(`${this.baseUrl}/api/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: this.modelName }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Ollama pull failed: ${res.statusText}`);
      // Consume the streaming response
      await res.text();
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Text generation ───────────────────────────────────────────────

  async generate(prompt, options = {}) {
    // BUG FIX: do NOT pull model here — that would block the request for minutes.
    // If model isn't ready yet, try anyway (Ollama may still serve if model exists
    // from a previous run) and let the error propagate to the fallback chain.
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS);

      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.modelName,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 2048,
            top_p: options.topP ?? 0.95,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);

      const data = await res.json();
      const text = (data.response || "").trim();

      // Mark model as ready on first successful generation
      if (text.length > 0) this.#modelReady = true;

      return text || null;
    } catch (err) {
      const reason = err.name === "AbortError" ? `timeout after ${GENERATE_TIMEOUT_MS}ms` : err.message;
      console.error(`[OllamaProvider] API error: ${reason}`);
      return null;
    }
  }
}
