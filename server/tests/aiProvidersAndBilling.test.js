import test from "node:test";
import assert from "node:assert/strict";

import { testProviderConnection, getActiveModel } from "../modules/llm/index.js";
import { getPlanLimits, PLANS, PLAN_LIMITS, changePlan } from "../modules/billing/billing.service.js";

test("1. testProviderConnection rejects unsupported providers with a structured error", async () => {
  const result = await testProviderConnection({ provider: "totally-not-real", apiKey: "x" });

  assert.equal(result.provider, "totally-not-real");
  assert.equal(result.status, "unknown");
  assert.match(result.error, /not supported/i);
});

test("2. testProviderConnection is case-insensitive when resolving providers", async () => {
  const result = await testProviderConnection({ provider: "Google", apiKey: "" });

  assert.equal(result.status, "unconfigured", "google with no key must report unconfigured, not throw");
});

test("3. testProviderConnection returns unconfigured (not throw) for google without a key", async () => {
  const result = await testProviderConnection({ provider: "google", apiKey: "", model: "gemini-2.0-flash" });

  assert.equal(result.status, "unconfigured");
  assert.ok(typeof result.error === "string" || result.error === undefined);
});

test("4. testProviderConnection returns unconfigured (not throw) for grok without a key", async () => {
  const result = await testProviderConnection({ provider: "grok" });

  assert.equal(result.status, "unconfigured");
});

test("5. testProviderConnection returns unconfigured (not throw) for claude without a key", async () => {
  const result = await testProviderConnection({ provider: "claude" });

  assert.equal(result.status, "unconfigured");
});

test("6. getActiveModel resolves a real provider model name", () => {
  const model = getActiveModel();
  assert.equal(typeof model, "string");
  assert.ok(model.length > 0);
});

test("7. PLAN_LIMITS covers all four plans with strict entitlement ordering", () => {
  assert.deepEqual(PLANS, ["free", "starter", "business", "enterprise"]);

  const free = getPlanLimits("free");
  const enterprise = getPlanLimits("enterprise");

  assert.equal(free.price_usd, 0);
  assert.ok(enterprise.ai_requests_limit > free.ai_requests_limit);
  assert.ok(enterprise.storage_limit > free.storage_limit);
  assert.ok(enterprise.price_usd > 0);
});

test("8. getPlanLimits returns the exact configured limits for each plan", () => {
  for (const plan of PLANS) {
    assert.deepEqual(getPlanLimits(plan), PLAN_LIMITS[plan]);
  }
});

test("9. getPlanLimits falls back to free for an unknown plan", () => {
  assert.deepEqual(getPlanLimits("nonexistent-plan"), PLAN_LIMITS.free);
  assert.deepEqual(getPlanLimits(undefined), PLAN_LIMITS.free);
});

test("10. changePlan rejects an invalid plan before touching the database", async () => {
  await assert.rejects(
    () => changePlan({ orgId: "000000000000000000000001", newPlan: "mega-ultra", adminUser: "u1" }),
    /Invalid plan/i
  );
});

test("11. changePlan blocks downgrade to the free plan", async () => {
  await assert.rejects(
    () => changePlan({ orgId: "000000000000000000000001", newPlan: "free", adminUser: "u1" }),
    /Cannot downgrade to the free plan/i
  );
});
