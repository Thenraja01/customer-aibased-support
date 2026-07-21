import { LLMProvider } from "./base.provider.js";

export class FallbackProvider extends LLMProvider {
  name = "fallback";

  async generate(prompt, options = {}) {
    return this.#respond(options.userMessage || prompt);
  }

  #respond(input) {
    const lower = input.toLowerCase().replace(/[^\w\s]/g, "").trim();

    if (["hi", "hello", "hey", "howdy", "sup", "good morning", "good evening", "good afternoon"].some((g) => lower === g || lower.startsWith(g + " ") || lower.endsWith(" " + g) || lower.includes(" " + g + " "))) {
      return "Hello! How can I assist you today?";
    }
    if (["thanks", "thank you", "thx", "ty", "appreciate it", "thank you so much"].some((t) => lower.includes(t))) {
      return "You're welcome. Is there anything else I can help with?";
    }
    if (["bye", "goodbye", "see you", "see ya", "talk later"].some((b) => lower.includes(b))) {
      return "Goodbye. Feel free to reach out anytime.";
    }

    if (lower.includes("shipping") || lower.includes("delivery") || lower.includes("shipment") || lower.includes("track") || lower.includes("order status") || lower.includes("where is my")) {
      return "Please provide your order number so I can check the shipping status.";
    }
    if (lower.includes("return") || lower.includes("refund") || lower.includes("exchange") || lower.includes("money back")) {
      return "Please share your order number and whether you'd like a return or refund.";
    }
    if (lower.includes("account") || lower.includes("login") || lower.includes("password") || lower.includes("sign in") || lower.includes("log in") || lower.includes("forgot")) {
      return "Please describe the account issue you're experiencing so I can assist.";
    }
    if (lower.includes("billing") || lower.includes("payment") || lower.includes("invoice") || lower.includes("charge") || lower.includes("subscription") || lower.includes("price") || lower.includes("cost")) {
      return "Please provide more details about your billing inquiry so I can help.";
    }
    if (lower.includes("cancel") || lower.includes("cancellation")) {
      return "Please share what you'd like to cancel so I can assist.";
    }
    if (lower.includes("bug") || lower.includes("error") || lower.includes("issue") || lower.includes("problem") || lower.includes("not working") || lower.includes("broken") || lower.includes("crash") || lower.includes("glitch")) {
      return "Please describe the issue you're encountering, including any error messages.";
    }
    if (lower.includes("contact") || lower.includes("speak") || lower.includes("agent") || lower.includes("human") || lower.includes("representative") || lower.includes("person")) {
      return "Let me try to help first. If I can't resolve it, I'll connect you with our support team.";
    }

    return "Please provide more details so I can assist you.";
  }
}
