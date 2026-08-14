import { healthCheck, getActiveProvider } from "../llm/index.js";

/**
 * Aggregates health checks from all configured LLM providers.
 */
export const modelHealth = async ({ organizationId }) => {
  // We can use organizationId later to fetch org-specific LLM config if needed.
  const checks = await healthCheck();
  const active = getActiveProvider();
  
  return {
    activeProvider: active,
    timestamp: new Date().toISOString(),
    providers: checks,
  };
};
