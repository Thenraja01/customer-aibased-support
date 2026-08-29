/**
 * Safe Structured Observability Logger for LLM Invocations.
 *
 * CRITICAL RULE:
 * Never log API keys, authorization headers, full sensitive user conversations,
 * or confidential tenant data.
 */

export const logLLMAttempt = ({
  requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  organizationId = "global",
  provider,
  model,
  attempt = 1,
  isDefault = false,
  isFallback = false,
  status = "SUCCESS", // "SUCCESS" | "FAILED" | "SKIPPED_CIRCUIT_OPEN"
  errorType = null,
  errorMessage = null,
  latencyMs = 0,
  tokenCount = null,
}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    requestId: String(requestId),
    organizationId: String(organizationId || "global"),
    provider: String(provider || "unknown").toLowerCase(),
    model: String(model || "unknown"),
    attempt: Number(attempt),
    isDefault: Boolean(isDefault),
    isFallback: Boolean(isFallback),
    status,
    errorType: errorType || null,
    errorMessage: errorMessage ? String(errorMessage).slice(0, 200) : null,
    latencyMs: Math.round(latencyMs),
    tokenCount: tokenCount || null,
  };

  const role = isDefault ? "DEFAULT" : isFallback ? "FALLBACK" : "PRIMARY";
  const icon = status === "SUCCESS" ? "✅" : status === "FAILED" ? "❌" : "⚠️";

  console.log(
    `[LLM Observability] ${icon} [${logEntry.requestId}] org=${logEntry.organizationId} role=${role} attempt=${attempt} provider=${logEntry.provider} model=${logEntry.model} status=${status} latency=${logEntry.latencyMs}ms${
      errorType ? ` err=${errorType}` : ""
    }`
  );

  return logEntry;
};
