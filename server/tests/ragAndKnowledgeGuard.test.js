import test from "node:test";
import assert from "node:assert/strict";

import { shouldLogKnowledgeGap, isOperationalQuery } from "../modules/chat/aiChat.service.js";

test("1. Operational/DB queries are detected (copilot-style, not KB questions)", () => {
  assert.equal(isOperationalQuery("Show pending tickets"), true);
  assert.equal(isOperationalQuery("How many pending tickets are there?"), true);
  assert.equal(isOperationalQuery("List all users in the system"), true);
  assert.equal(isOperationalQuery("Get status of order #123"), true);
  assert.equal(isOperationalQuery("Create a new ticket for this issue"), true);
});

test("2. Genuine knowledge questions are NOT treated as operational", () => {
  assert.equal(isOperationalQuery("What is your refund policy?"), false);
  assert.equal(isOperationalQuery("How long does shipping take?"), false);
  assert.equal(isOperationalQuery("How do I reset my password?"), false);
  assert.equal(isOperationalQuery(""), false);
});

test("3. shouldLogKnowledgeGap returns false when org has no knowledge base", () => {
  assert.equal(
    shouldLogKnowledgeGap({ orgHasKnowledgeBase: false, intent: "question", userMessage: "What is X?" }),
    false
  );
});

test("4. shouldLogKnowledgeGap returns false for greetings / small-talk", () => {
  assert.equal(
    shouldLogKnowledgeGap({ orgHasKnowledgeBase: true, intent: "greeting", userMessage: "Hi" }),
    false
  );
  assert.equal(
    shouldLogKnowledgeGap({ orgHasKnowledgeBase: true, intent: "thanks", userMessage: "Thanks" }),
    false
  );
});

test("5. shouldLogKnowledgeGap returns false for operational/DB questions", () => {
  assert.equal(
    shouldLogKnowledgeGap({ orgHasKnowledgeBase: true, intent: "question", userMessage: "Show pending tickets" }),
    false
  );
  assert.equal(
    shouldLogKnowledgeGap({ orgHasKnowledgeBase: true, intent: "question", userMessage: "How many users are active?" }),
    false
  );
});

test("6. shouldLogKnowledgeGap returns true for genuine unanswered KB questions", () => {
  assert.equal(
    shouldLogKnowledgeGap({ orgHasKnowledgeBase: true, intent: "question", userMessage: "How do I reset my password?" }),
    true
  );
  assert.equal(
    shouldLogKnowledgeGap({ orgHasKnowledgeBase: true, intent: "question", userMessage: "What are the working hours?" }),
    true
  );
});