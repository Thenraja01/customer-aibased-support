import test from "node:test";
import assert from "node:assert/strict";

import { resolveTool, normalizeToolName } from "../modules/agent/actionRegistry.js";
import { extractToolNameFromParsed } from "../modules/agent/intentPlanner.js";
import * as businessTools from "../services/business-ai/businessTools.js";

test("1. normalizeToolName rejects literal undefined/null/empty strings", () => {
  assert.equal(normalizeToolName(undefined), null);
  assert.equal(normalizeToolName(""), null);
  assert.equal(normalizeToolName("   "), null);
  assert.equal(normalizeToolName("undefined"), null);
  assert.equal(normalizeToolName("null"), null);
  assert.equal(normalizeToolName("UNDEFINED"), null);
});

test("2. resolveTool resolves aliases and canonical tools to registry entries", () => {
  const alias = resolveTool("get_pending_tickets");
  assert.ok(alias, "alias must resolve to a registry entry");
  assert.equal(alias.tool, "getTickets");
  assert.equal(typeof alias.handler, "function");

  const canonical = resolveTool("get_refund");
  assert.ok(canonical, "refund tool must resolve");
  assert.equal(canonical.tool, "get_refund");
  assert.equal(typeof canonical.handler, "function");

  const refundCreate = resolveTool("raise_refund");
  assert.equal(refundCreate.tool, "create_refund");
});

test("3. resolveTool returns null for unknown/unsupported tool names", () => {
  assert.equal(resolveTool("unknown_fake_tool_123"), null);
  assert.equal(resolveTool("undefined"), null);
  assert.equal(resolveTool(null), null);
  assert.equal(resolveTool(""), null);
});

test("4. Resolved handler is the same businessTools function (single source of truth)", () => {
  const alias = resolveTool("get_pending_tickets");
  assert.equal(alias.handler, businessTools["getTickets"]);

  const refund = resolveTool("refund_status");
  assert.equal(refund.handler, businessTools["get_refund"]);

  const users = resolveTool("users");
  assert.equal(users.handler, businessTools["getUsers"]);
});

test("5. extractToolNameFromParsed treats 'undefined'/empty as no tool", () => {
  assert.equal(extractToolNameFromParsed({ tool: "undefined" }), null);
  assert.equal(extractToolNameFromParsed({ tool: "" }), null);
  assert.equal(extractToolNameFromParsed({ name: "null" }), null);
  assert.equal(extractToolNameFromParsed({}), null);
  assert.equal(extractToolNameFromParsed(null), null);
});

test("6. extractToolNameFromParsed normalizes schema-key variations to canonical tools", () => {
  assert.equal(extractToolNameFromParsed({ tool: "get_refund" }), "get_refund");
  assert.equal(extractToolNameFromParsed({ action: "create_refund" }), "create_refund");
  assert.equal(extractToolNameFromParsed({ function: "list_tickets" }), "getTickets");
  assert.equal(extractToolNameFromParsed({ name: "pending_tickets" }), "getTickets");
  assert.equal(extractToolNameFromParsed({ tool_name: "get_pending_items" }), "getPendingItems");
});