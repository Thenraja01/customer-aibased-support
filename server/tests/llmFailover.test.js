import { classifyLLMError, FailureCategory } from "../modules/llm/failureClassifier.js";
import { LLMCircuitBreaker, CircuitState } from "../modules/llm/circuitBreaker.js";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 STARTING PRODUCTION LLM FAILOVER & CIRCUIT BREAKER TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ── TEST 1: Failure Classification ───────────────────────────
  console.log("\n--- TEST GROUP 1: Centralized Failure Classifier ---");

  // 1.1: 401 Unauthorized
  const err401 = new Error("Invalid API key provided");
  err401.status = 401;
  const c401 = classifyLLMError(err401, { provider: "groq", model: "llama3.3" });
  assert(c401.isFailoverWorthy === true, "401 is failover worthy");
  assert(c401.category === FailureCategory.AUTHENTICATION_ERROR, "401 categorized as AUTHENTICATION_ERROR");

  // 1.2: 429 Rate Limit
  const err429 = new Error("Rate limit exceeded for organization");
  err429.status = 429;
  const c429 = classifyLLMError(err429, { provider: "gemini", model: "gemini-1.5" });
  assert(c429.isFailoverWorthy === true, "429 is failover worthy");
  assert(c429.category === FailureCategory.RATE_LIMIT, "429 categorized as RATE_LIMIT");

  // 1.3: ECONNREFUSED (Ollama offline)
  const errRefused = new Error("fetch failed");
  errRefused.code = "ECONNREFUSED";
  const cRefused = classifyLLMError(errRefused, { provider: "ollama", model: "llama3.2" });
  assert(cRefused.isFailoverWorthy === true, "ECONNREFUSED is failover worthy");
  assert(cRefused.category === FailureCategory.CONNECTION_REFUSED, "ECONNREFUSED categorized as CONNECTION_REFUSED");

  // 1.4: 500 Internal Server Error
  const err500 = new Error("Internal Server Error from upstream cluster");
  err500.status = 500;
  const c500 = classifyLLMError(err500, { provider: "claude", model: "claude-3-5" });
  assert(c500.isFailoverWorthy === true, "500 is failover worthy");
  assert(c500.category === FailureCategory.PROVIDER_UNAVAILABLE, "500 categorized as PROVIDER_UNAVAILABLE");

  // 1.5: Client Cancellation (Not a provider failure)
  const errAbort = new Error("User cancelled request");
  errAbort.name = "AbortError";
  const cAbort = classifyLLMError(errAbort, { provider: "ollama", model: "llama3.2" });
  assert(cAbort.isFailoverWorthy === false, "Client abort is NOT failover worthy");
  assert(cAbort.category === FailureCategory.NON_FAILOVER_ERROR, "Abort categorized as NON_FAILOVER_ERROR");

  // ── TEST GROUP 2: Circuit Breaker Lifecycle ───────────────────
  console.log("\n--- TEST GROUP 2: Circuit Breaker Lifecycle ---");

  const cb = new LLMCircuitBreaker({
    failureThreshold: 3,
    cooldownMs: 200, // 200ms for fast test execution
  });

  const tenant = "org_test_123";
  const provider = "ollama";
  const model = "llama3.2:3b";

  // Initial State: CLOSED
  assert(cb.canExecute(tenant, provider, model) === true, "Initial circuit state allows execution (CLOSED)");
  assert(cb.getStatus(tenant, provider, model).state === CircuitState.CLOSED, "State is CLOSED");

  // Failure 1
  cb.recordFailure(tenant, provider, model, { message: "Error 1" });
  assert(cb.canExecute(tenant, provider, model) === true, "Failure 1: Circuit still CLOSED");

  // Failure 2
  cb.recordFailure(tenant, provider, model, { message: "Error 2" });
  assert(cb.canExecute(tenant, provider, model) === true, "Failure 2: Circuit still CLOSED");

  // Failure 3: Trip to OPEN
  cb.recordFailure(tenant, provider, model, { message: "Error 3" });
  assert(cb.getStatus(tenant, provider, model).state === CircuitState.OPEN, "Failure 3: Circuit TRIPPED to OPEN");
  assert(cb.canExecute(tenant, provider, model) === false, "Circuit OPEN: Execution blocked during cooldown");

  // Wait for cooldown to expire
  await new Promise((r) => setTimeout(r, 250));

  // State should now transition to HALF_OPEN to allow probe
  assert(cb.canExecute(tenant, provider, model) === true, "After cooldown: Circuit allows HALF_OPEN probe");
  assert(cb.getStatus(tenant, provider, model).state === CircuitState.HALF_OPEN, "State is HALF_OPEN");

  // Successful probe recovers circuit to CLOSED
  cb.recordSuccess(tenant, provider, model);
  assert(cb.getStatus(tenant, provider, model).state === CircuitState.CLOSED, "Success probe recovers circuit to CLOSED");
  assert(cb.getStatus(tenant, provider, model).consecutiveFailures === 0, "Consecutive failures reset to 0");

  // Manual reset test
  cb.recordFailure(tenant, provider, model, { message: "Fail 1" });
  cb.recordFailure(tenant, provider, model, { message: "Fail 2" });
  cb.recordFailure(tenant, provider, model, { message: "Fail 3" });
  assert(cb.getStatus(tenant, provider, model).state === CircuitState.OPEN, "Tripped to OPEN again");
  cb.reset(tenant, provider, model);
  assert(cb.getStatus(tenant, provider, model).state === CircuitState.CLOSED, "Manual reset immediately returns circuit to CLOSED");

  console.log("\n==================================================");
  console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
