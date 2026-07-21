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
    return !!process.env.GEMINI_API_KEY;
  }

  async generate(prompt, options = {}) {
    if (!this.isAvailable()) return null;
    if (!client) client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
      const model = client.getGenerativeModel({ model: this.modelName });
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
