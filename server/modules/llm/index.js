import { GeminiProvider } from "./providers/gemini.provider.js";
import { GroqProvider } from "./providers/groq.provider.js";
import { FallbackProvider } from "./providers/fallback.provider.js";

const providers = [
  new GeminiProvider(),
  new GroqProvider(),
  new FallbackProvider(),
];

const preferredName = (process.env.LLM_PROVIDER || "gemini").toLowerCase();

const cleanResponse = (text) => {
  if (!text) return "";
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  text = text.replace(/<think>[\s\S]*/gi, "");
  return text.trim();
};

export const generateResponse = async (prompt, userMessage, options = {}) => {
  const preferred = providers.find((p) => p.name === preferredName && p.isAvailable?.() !== false);
  const others = providers.filter((p) => p !== preferred && p.name !== "fallback");
  const fallback = providers.find((p) => p.name === "fallback");

  const chain = preferred ? [preferred, ...others, fallback] : [...others, fallback];

  for (const provider of chain) {
    if (provider.isAvailable && !provider.isAvailable()) continue;
    const result = await provider.generate(prompt, { ...options, userMessage });
    if (result !== null && result !== undefined) return cleanResponse(result);
  }

  return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
};
