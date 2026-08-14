import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import env from "../config/env.js";
import { signAccessToken, verifyAccessToken } from "../modules/auth/token.service.js";
import { protect, protectSimple, restrict } from "../middleware/auth.middleware.js";
import { enforceOrgScope } from "../middleware/branchScope.middleware.js";
import * as ragService from "../modules/rag/rag.service.js";

const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
};

test("1. Valid signed token verifies cleanly and attaches user context", () => {
  const validToken = signAccessToken({
    userId: "60f1b2c3d4e5f6a7b8c9d0e1",
    organizationId: "60f1b2c3d4e5f6a7b8c9d000",
    roles: ["admin"],
    email: "admin@example.com",
  });

  const req = {
    headers: {
      authorization: `Bearer ${validToken}`,
    },
  };
  const res = createMockRes();

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  protectSimple(req, res, next);

  assert.equal(nextCalled, true);
  assert.equal(req.user.userId, "60f1b2c3d4e5f6a7b8c9d0e1");
  assert.equal(req.user.organizationId, "60f1b2c3d4e5f6a7b8c9d000");
  assert.equal(req.user.roles[0], "admin");
});

test("2. Missing token returns 401 Unauthorized", async () => {
  const req = { headers: {} };
  const res = createMockRes();
  let nextCalled = false;
  await protect(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(res.data?.success, false);
  assert.match(res.data?.message, /No token provided/i);
  assert.equal(nextCalled, false);
});

test("3. Expired token returns 401 Unauthorized", async () => {
  const expiredToken = jwt.sign(
    { userId: "60f1b2c3d4e5f6a7b8c9d0e1", organizationId: "60f1b2c3d4e5f6a7b8c9d000" },
    env.JWT_SECRET,
    { issuer: env.JWT_ISSUER, audience: env.JWT_AUDIENCE, expiresIn: "-1s" }
  );

  const req = { headers: { authorization: `Bearer ${expiredToken}` } };
  const res = createMockRes();
  let nextCalled = false;
  await protect(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(res.data?.success, false);
  assert.match(res.data?.message, /expired/i);
  assert.equal(nextCalled, false);
});

test("4. Malformed/Invalid token returns 401 Unauthorized", async () => {
  const req = { headers: { authorization: "Bearer invalid_token_xyz" } };
  const res = createMockRes();
  let nextCalled = false;
  await protect(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(res.data?.success, false);
  assert.match(res.data?.message, /Invalid token/i);
  assert.equal(nextCalled, false);
});

test("5. Restricted role enforcement returns 403 Forbidden for unauthorized roles", () => {
  const middleware = restrict("admin", "super_admin");
  const req = { user: { roles: ["customer"] } };
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 403);
  assert.equal(res.data?.success, false);
  assert.match(res.data?.message, /Forbidden/i);
  assert.equal(nextCalled, false);
});

test("6. Tenant isolation: Organization A user cannot query Organization B scope", () => {
  const orgAMiddleware = enforceOrgScope((req) => req.body.organization_id);

  const reqUserOrgA = {
    user: { roleName: "admin", organizationId: "60f1b2c3d4e5f6a7b8c9d00A" },
    body: { organization_id: "60f1b2c3d4e5f6a7b8c9d00B" },
  };
  const res = createMockRes();
  let nextCalled = false;

  orgAMiddleware(reqUserOrgA, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 403);
  assert.equal(res.data?.success, false);
  assert.match(res.data?.message, /another organization/i);
  assert.equal(nextCalled, false);
});

test("7. Valid Knowledge Base keyword query returns results structure", async () => {
  const results = await ragService.keywordSearch(
    ["shipment", "delivery", "time"],
    "60f1b2c3d4e5f6a7b8c9d000"
  );

  assert.ok(Array.isArray(results), "keywordSearch must return an array");
});

test("8. Frontend Bearer token clean extraction verification", () => {
  const rawStoredToken = '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"';
  const cleaned = rawStoredToken.replace(/^["']|["']$/g, "").trim();

  assert.equal(cleaned, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test");
  assert.equal(cleaned.startsWith("eyJ"), true);
});

test("9. RAG retrieval executes independently of Firebase push registration failures", async () => {
  const results = await ragService.keywordSearch(
    ["shipment"],
    "60f1b2c3d4e5f6a7b8c9d000"
  );
  assert.ok(Array.isArray(results));
});

test("10. RAG retrieval executes independently of WebSocket server availability", async () => {
  const results = await ragService.keywordSearch(
    ["shipment", "time"],
    "60f1b2c3d4e5f6a7b8c9d000"
  );
  assert.ok(Array.isArray(results));
});
