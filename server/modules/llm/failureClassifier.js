/**
 * Centralized Failure Classifier for LLM Providers.
 *
 * CRITICAL RULE:
 * A slow model is NOT a failed model. Normal network latency, long generation times,
 * and slow RAG queries must never trigger a provider failover.
 *
 * Only genuine, classified provider failures trigger fallback:
 * - 401 Unauthorized / 403 Forbidden (Invalid / expired API Key)
 * - 404 Model Not Found
 * - 429 Rate Limit / Quota Exceeded
 * - 500 Internal Server Error / 502 Bad Gateway / 503 Service Unavailable / 504 Gateway Timeout
 * - ECONNREFUSED / ENOTFOUND / EHOSTUNREACH / ECONNRESET (Connection failures)
 * - Provider API explicitly unreachable
 */

export const FailureCategory = {
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  MODEL_NOT_FOUND: "MODEL_NOT_FOUND",
  RATE_LIMIT: "RATE_LIMIT",
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
  CONNECTION_REFUSED: "CONNECTION_REFUSED",
  CONNECTION_RESET: "CONNECTION_RESET",
  INVALID_CONFIG: "INVALID_CONFIG",
  UNKNOWN_PROVIDER_ERROR: "UNKNOWN_PROVIDER_ERROR",
  NON_FAILOVER_ERROR: "NON_FAILOVER_ERROR", // e.g. client cancellation, normal aborts
};

/**
 * Classifies an error thrown during LLM invocation.
 * @param {Error|any} error
 * @param {object} context - { provider, model }
 * @returns {{ isFailoverWorthy: boolean, category: string, status: number|null, message: string }}
 */
export const classifyLLMError = (error, context = {}) => {
  if (!error) {
    return {
      isFailoverWorthy: false,
      category: FailureCategory.NON_FAILOVER_ERROR,
      status: null,
      message: "No error",
    };
  }

  const rawMessage = String(error.message || error.statusText || error || "");
  const lowerMsg = rawMessage.toLowerCase();
  const status = error.status || error.statusCode || error.response?.status || null;

  // 1. Check for client-side cancellations / aborts that are NOT provider failures
  if (
    error.name === "AbortError" &&
    (lowerMsg.includes("user cancelled") || lowerMsg.includes("client disconnect"))
  ) {
    return {
      isFailoverWorthy: false,
      category: FailureCategory.NON_FAILOVER_ERROR,
      status: 499,
      message: "Request was cancelled by client or user.",
    };
  }

  // 2. Authentication / API Key Errors (401, 403)
  if (
    status === 401 ||
    status === 403 ||
    lowerMsg.includes("invalid api key") ||
    lowerMsg.includes("unauthorized") ||
    lowerMsg.includes("forbidden") ||
    lowerMsg.includes("api_key_invalid") ||
    lowerMsg.includes("authentication failed")
  ) {
    return {
      isFailoverWorthy: true,
      category: FailureCategory.AUTHENTICATION_ERROR,
      status: status || 401,
      message: `Authentication failure for provider "${context.provider || 'unknown'}": ${rawMessage}`,
    };
  }

  // 3. Model Not Found (404)
  if (
    status === 404 ||
    lowerMsg.includes("model not found") ||
    lowerMsg.includes("does not exist") ||
    lowerMsg.includes("model_not_found")
  ) {
    return {
      isFailoverWorthy: true,
      category: FailureCategory.MODEL_NOT_FOUND,
      status: 404,
      message: `Model "${context.model || 'unknown'}" not found on provider "${context.provider || 'unknown'}".`,
    };
  }

  // 4. Rate Limiting / Quota Exceeded (429)
  if (
    status === 429 ||
    lowerMsg.includes("rate limit") ||
    lowerMsg.includes("too many requests") ||
    lowerMsg.includes("quota exceeded") ||
    lowerMsg.includes("resource_exhausted")
  ) {
    return {
      isFailoverWorthy: true,
      category: FailureCategory.RATE_LIMIT,
      status: 429,
      message: `Rate limit / quota exceeded on provider "${context.provider || 'unknown'}".`,
    };
  }

  // 5. Connection Refused / Server Unreachable (Ollama down / Local port closed)
  if (
    error.code === "ECONNREFUSED" ||
    lowerMsg.includes("econnrefused") ||
    lowerMsg.includes("connection refused") ||
    lowerMsg.includes("fetch failed") ||
    lowerMsg.includes("failed to fetch")
  ) {
    return {
      isFailoverWorthy: true,
      category: FailureCategory.CONNECTION_REFUSED,
      status: 503,
      message: `Connection refused to provider "${context.provider || 'unknown'}". Service may be offline.`,
    };
  }

  // 6. Connection Reset / Network Drops
  if (
    error.code === "ECONNRESET" ||
    error.code === "EPIPE" ||
    error.code === "ETIMEDOUT" ||
    lowerMsg.includes("econnreset") ||
    lowerMsg.includes("socket hang up") ||
    lowerMsg.includes("connection reset")
  ) {
    return {
      isFailoverWorthy: true,
      category: FailureCategory.CONNECTION_RESET,
      status: 504,
      message: `Connection reset / timeout by provider "${context.provider || 'unknown'}".`,
    };
  }

  // 7. Server / Gateway Errors (500, 502, 503, 504)
  if (
    (status >= 500 && status <= 599) ||
    lowerMsg.includes("internal server error") ||
    lowerMsg.includes("bad gateway") ||
    lowerMsg.includes("service unavailable") ||
    lowerMsg.includes("gateway timeout") ||
    lowerMsg.includes("overloaded")
  ) {
    return {
      isFailoverWorthy: true,
      category: FailureCategory.PROVIDER_UNAVAILABLE,
      status: status || 503,
      message: `Provider "${context.provider || 'unknown'}" server error (${status || 500}): ${rawMessage}`,
    };
  }

  // 8. Missing / Invalid Configuration (e.g. missing API key before call)
  if (lowerMsg.includes("no api key") || lowerMsg.includes("not configured")) {
    return {
      isFailoverWorthy: true,
      category: FailureCategory.INVALID_CONFIG,
      status: 400,
      message: `Provider "${context.provider || 'unknown'}" configuration invalid or missing.`,
    };
  }

  // 9. Generic Fallback for unclassified fatal errors from provider SDKs
  return {
    isFailoverWorthy: true,
    category: FailureCategory.UNKNOWN_PROVIDER_ERROR,
    status: status || 500,
    message: rawMessage || "Unknown provider failure",
  };
};
