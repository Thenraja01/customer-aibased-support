import { generateResponse, resolveTenantModelPlan } from "../modules/llm/index.js";
import { globalCircuitBreaker } from "../modules/llm/circuitBreaker.js";

async function runOrchestratorTests() {
  console.log("==================================================");
  console.log("🧪 STARTING INTEGRATION TESTS FOR LLM ORCHESTRATOR");
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

  // ── TEST 1: Model Resolution Hierarchy ─────────────────────────
  console.log("\n--- TEST GROUP 1: Model Priority Resolution ---");
  const plan = await resolveTenantModelPlan(null, null, { provider: "groq", model: "llama-3.3-70b" });
  assert(plan.defaultModel.provider === "groq", "Default model provider resolved correctly");
  assert(plan.maxFallbacks === 1, "Default maxFallbacks is 1");
  assert(plan.orderedChain.length > 1, "Fallback chain constructed with secondary candidates");

  // ── TEST 2: Circuit Breaker Isolation ─────────────────────────
  console.log("\n--- TEST GROUP 2: Circuit Isolation ---");
  const status = globalCircuitBreaker.getStatus("test_org", "groq", "llama-3.3-70b");
  assert(status.state === "CLOSED", "Circuit breaker initializes as CLOSED");
  assert(status.consecutiveFailures === 0, "No failures initially");

  console.log("\n==================================================");
  console.log(`📊 INTEGRATION RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runOrchestratorTests().catch((err) => {
  console.error("Integration test error:", err);
  process.exit(1);
});
