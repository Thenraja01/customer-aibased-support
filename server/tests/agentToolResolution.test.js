import test from "node:test";
import assert from "node:assert/strict";

import { extractIntent, extractToolNameFromParsed } from "../modules/agent/intentPlanner.js";
import { resolveActionForRole, enforceActionAccess, resolveScope } from "../modules/agent/rbacGate.js";
import { getActionByTool, getAction } from "../modules/agent/actionRegistry.js";
import * as businessTools from "../services/business-ai/businessTools.js";

test("1. Valid registered tool call resolution", () => {
  const getTicketsAction = getActionByTool("getTickets");
  assert.ok(getTicketsAction, "getTickets must be registered in action registry");
  assert.equal(getTicketsAction.tool, "getTickets");

  const pendingItemsAction = getActionByTool("getPendingItems");
  assert.ok(pendingItemsAction, "getPendingItems must be registered in action registry");
  assert.equal(pendingItemsAction.tool, "getPendingItems");

  const fn = businessTools["getTickets"];
  assert.equal(typeof fn, "function", "getTickets must exist in businessTools module");
});

test("2. Missing tool name handling", () => {
  const gate = resolveActionForRole("admin", null);
  assert.equal(gate.allowed, false);
  assert.match(gate.reason, /missing or invalid/i);

  const parsedTool = extractToolNameFromParsed({});
  assert.equal(parsedTool, null, "Empty object should return null for tool name");
});

test("3. Undefined tool name handling", () => {
  const gate = resolveActionForRole("admin", undefined);
  assert.equal(gate.allowed, false);
  assert.match(gate.reason, /missing or invalid/i);

  const parsedTool = extractToolNameFromParsed({ tool: undefined });
  assert.equal(parsedTool, null, "Undefined tool should return null for tool name");
});

test("4. Unknown tool name handling", () => {
  const gate = resolveActionForRole("admin", "unknown_fake_tool_123");
  assert.equal(gate.allowed, false);
  assert.match(gate.reason, /Unknown tool/i);
});

test("5. Unauthorized tool call handling (RBAC)", () => {
  const gate = resolveActionForRole("support", "getOrganizations");
  assert.equal(gate.allowed, false, "Support user must not be authorized for getOrganizations");
  assert.match(gate.reason, /not authorized/i);

  const adminGate = resolveActionForRole("admin", "getTickets");
  assert.equal(adminGate.allowed, true, "ORG ADMIN must be authorized for getTickets");
});

test("6. Pending-ticket query intent extraction ('How many pending tickets are there?')", async () => {
  const intent = await extractIntent({
    message: "How many pending tickets are there?",
    role: "admin",
    scope: "organization",
  });

  assert.equal(intent.type, "tool");
  assert.ok(intent.tool === "getTickets" || intent.tool === "getPendingItems", `Tool should be getTickets or getPendingItems, got: ${intent.tool}`);
  if (intent.tool === "getTickets") {
    assert.equal(intent.args.status, "pending");
  }
});

test("7. Malformed model tool-call response normalization (Qwen / Llama schema key variations)", () => {
  const variations = [
    { tool: "getTickets" },
    { tool_name: "getTickets" },
    { name: "getTickets" },
    { function: "getTickets" },
    { action: "getTickets" },
    { tool: "get_pending_tickets" },
    { name: "pending_tickets" },
    { function: "list_tickets" },
  ];

  for (const item of variations) {
    const extracted = extractToolNameFromParsed(item);
    assert.equal(extracted, "getTickets", `Failed for input: ${JSON.stringify(item)}`);
  }
});

test("8. End-to-end Copilot request intent resolution & RBAC check for Org Admin", async () => {
  const mockUser = {
    userId: "60f1b2c3d4e5f6a7b8c9d0e1",
    roleName: "admin",
    organizationId: "60f1b2c3d4e5f6a7b8c9d000",
  };

  const scope = resolveScope(mockUser);
  assert.equal(scope.role, "admin");
  assert.equal(scope.scope, "organization");

  const intent = await extractIntent({
    message: "How many pending tickets are there?",
    role: scope.role,
    scope: scope.scope,
    organizationId: scope.organizationId,
  });

  assert.equal(intent.type, "tool");
  assert.ok(intent.tool === "getTickets" || intent.tool === "getPendingItems");

  const gate = resolveActionForRole(scope.role, intent.tool);
  assert.equal(gate.allowed, true, "ORG ADMIN must pass RBAC gate for pending ticket tool");
});
