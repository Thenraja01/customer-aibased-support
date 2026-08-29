import { LLMProvider } from "./base.provider.js";
import { warmupEmbeddingModel } from "../../../services/embedding.service.js";

export class OllamaProvider extends LLMProvider {
  name = "ollama";

  #modelReady = false;
  #warmupStarted = false;

  constructor() {
    super();
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.modelName = process.env.OLLAMA_MODEL || "llama3.2:3b";

    // Warm up the model at construction time (server startup)
    if (process.env.OLLAMA_WARMUP_ON_START !== "false") {
      this.#startWarmup();
    }
  }

  // ── Availability ─────────────────────────────────────────────────

  isAvailable() {
    return true;
  }

  // ── Health Check ─────────────────────────────────────────────────

  async healthCheck(options = {}) {
    const start = Date.now();
    const url = options.baseUrl || options.base_url || this.baseUrl;
    const model = options.model || this.modelName;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${url}/api/tags`, { signal: controller.signal });
      clearTimeout(timer);
      const elapsed = Date.now() - start;
      if (!res.ok) {
        return {
          provider: "ollama",
          status: "unhealthy",
          latencyMs: elapsed,
          model: model,
          error: `HTTP ${res.status}: ${res.statusText}`,
        };
      }
      const data = await res.json();
      const modelPresent = data.models?.some((m) =>
        m.name.startsWith(model.split(":")[0])
      );
      return {
        provider: "ollama",
        status: modelPresent ? "healthy" : "degraded",
        latencyMs: elapsed,
        model: model,
        details: { installedModels: data.models?.map((m) => m.name) || [] },
      };
    } catch (err) {
      return {
        provider: "ollama",
        status: "unhealthy",
        latencyMs: Date.now() - start,
        model: model,
        error: err.message,
      };
    }
  }

  // ── Background warm-up (startup only) ────────────────────────────

  #startWarmup() {
    if (this.#warmupStarted) return;
    this.#warmupStarted = true;

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
    const timer = setTimeout(() => controller.abort(), 10 * 60_000); // 10 min for model pull
    try {
      const res = await fetch(`${this.baseUrl}/api/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: this.modelName }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Model pull failed: ${res.status} ${res.statusText}`);
      await res.text();
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Text generation ───────────────────────────────────────────────

  async generate(prompt, options = {}) {
    const url = options.baseUrl || options.base_url || this.baseUrl;
    let model = options.model || this.modelName;
    if (model.includes("70b") || model.includes("gemini") || model.includes("claude") || model.includes("gpt")) {
      model = this.modelName;
    }

    // Allow natural generation time unless explicitly bounded (e.g. 5 minutes maximum safety net)
    const timeoutMs = options.timeout || (options.isBackgroundJob ? 180_000 : 300_000);

    const callOllama = async (modelToUse) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(`${url}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: modelToUse,
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

        if (!res.ok) {
          const errorText = await res.text().catch(() => "");
          const err = new Error(`Ollama API error: HTTP ${res.status} ${res.statusText} ${errorText}`.trim());
          err.status = res.status;
          throw err;
        }

        const data = await res.json();
        const text = (data.response || "").trim();
        if (text.length > 0) this.#modelReady = true;
        return text || "";
      } finally {
        clearTimeout(timer);
      }
    };

    try {
      return await callOllama(model);
    } catch (err) {
      if (err.status === 404 && model !== this.modelName) {
        console.warn(`[OllamaProvider] Model "${model}" not found. Retrying with local default "${this.modelName}"...`);
        return await callOllama(this.modelName);
      }
      console.error(`[OllamaProvider] Error (${model}):`, err.message);
      throw err;
    }
  }
}
