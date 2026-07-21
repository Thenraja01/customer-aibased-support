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
    return !!process.env.GROQ_API_KEY;
  }

  async generate(prompt, options = {}) {
    if (!this.isAvailable()) return null;
    if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    try {
      const completion = await client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: this.modelName,
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
