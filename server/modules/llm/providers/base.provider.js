export class LLMProvider {
  name = "base";

  isAvailable() {
    return true;
  }

  async generate(prompt, options = {}) {
    throw new Error("generate() must be implemented by subclass");
  }
}
