# Testing Strategy & Quality Assurance

SupportAI uses a multi-layered testing pyramid covering Unit, Integration, Security, and AI Quality Evaluation to ensure high reliability across multi-tenant boundaries.

---

## 1. Test Pyramid & Coverage Goals

```
                 / \
                /   \     E2E / Integration Tests (>80%)
               /     \    • Auth, Ticket Flows, Live Chat
              /───────\
             /         \   Security & RBAC Tests (>95%)
            /           \  • Tenant Isolation, Branch Scoping, Injection
           /─────────────\
          /               \ AI Safety & Intent Tests (>95%)
         /                 \ • Intent Planner, Grounding, Faithfulness
        /───────────────────\
       /                     \ Unit Tests (>90%)
      /                       \ • Services, SLA Engine, Validators, Schemas
     /─────────────────────────\
```

---

## 2. Test Suites Overview

### 2.1 Multi-Tenant & Security Tests (`server/tests/securityTenantIsolation.test.js`)
- **Tenant Isolation:** Verifies that Org A users cannot read/write Org B tickets, documents, or audit logs.
- **Branch Scoping:** Verifies that Branch Admins are confined to tickets within their branch code.
- **RBAC Gating:** Confirms 403 Forbidden responses when roles attempt unpermitted mutations.

### 2.2 Ticket Lifecycle & SLA Engine (`server/tests/ticketSystem.test.js`)
- **Status Transitions:** Tests valid state flow (`open` $\to$ `in_progress` $\to$ `resolved` $\to$ `closed`).
- **SLA Breach Calculations:** Tests response and resolution timer accuracy based on business hours.
- **Assignee Policy Engine:** Tests round-robin, load-balanced, and skill-based auto-routing.

### 2.3 AI Safety & Intent Planning (`server/tests/intentPlanner.test.js`, `server/tests/businessAiFaqSafety.test.js`)
- **Intent Extraction:** Validates exact parameter extraction from complex natural language inputs.
- **Prompt Injection Defense:** Validates that system directives cannot be overridden by user input.
- **Faithfulness Scoring:** Validates that hallucinations or unsupported claims trigger safe fallbacks.

### 2.4 Ticket AI Intelligence (`server/tests/ticketAiIntelligence.test.js`)
- **Category & Priority Classification:** Validates category and urgency prediction accuracy.
- **Sentiment Scoring:** Tests emotion evaluation against customer query datasets.
- **Duplicate Ticket KNN Detection:** Validates semantic duplicate identification threshold ($> 0.88$).

---

## 3. Running Test Commands

### Run All Backend Tests
```bash
cd server
npm test
```

### Run Security & Tenant Isolation Tests
```bash
npm test -- server/tests/securityTenantIsolation.test.js
```

### Run Ticket System & SLA Tests
```bash
npm test -- server/tests/ticketSystem.test.js
```

### Run AI Safety & Intent Tests
```bash
npm test -- server/tests/intentPlanner.test.js server/tests/businessAiFaqSafety.test.js
```
