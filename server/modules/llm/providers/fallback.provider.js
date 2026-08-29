import { LLMProvider } from "./base.provider.js";

export class FallbackProvider extends LLMProvider {
  name = "fallback";

  isAvailable() {
    return true;
  }

  async generate(prompt, options = {}) {
    const query = (options.userMessage || prompt || "").toLowerCase();

    if (query.includes("ship") || query.includes("delivery")) {
      return "Express shipping takes 2-3 business days. Standard shipping takes 5-7 business days across North America and Europe.";
    }

    if (query.includes("return") || query.includes("refund")) {
      return "We offer a 30-day money-back guarantee for all laptops in original condition with box and accessories.";
    }

    if (query.includes("warranty")) {
      return "All laptops come with a 2-year limited hardware warranty covering manufacturing defects and hardware failures.";
    }

    return "I am here to assist you with your inquiry. Would you like me to connect you with a human support agent?";
  }
}
