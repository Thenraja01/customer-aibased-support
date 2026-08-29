# SupportAI — REST & WebSocket API Specification

SupportAI exposes a structured, RESTful API and real-time Socket.io endpoints for customer support, ticket automation, RAG queries, and AI Copilot interaction.

---

## 1. Global Headers & Response Structure

### Request Headers
- `Authorization`: `Bearer <jwt_token>` (or `Bearer <api_key>`)
- `X-Organization-ID`: `<org_id>` (optional override if multi-tenant admin)
- `X-Branch-ID`: `<branch_id>` (optional sub-tenant scope)
- `Content-Type`: `application/json`

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED_RESOURCE_ACCESS",
    "message": "You do not have permission to view tickets outside your branch.",
    "statusCode": 403,
    "timestamp": "2026-08-24T10:45:00.000Z"
  }
}
```

---

## 2. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Access Level |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user / tenant account | Public |
| `POST` | `/api/auth/login` | Authenticate with email/password and obtain JWT | Public |
| `POST` | `/api/auth/otp/send` | Dispatch 6-digit OTP to user email | Public |
| `POST` | `/api/auth/otp/verify` | Verify email OTP & issue session token | Public |
| `POST` | `/api/auth/refresh` | Refresh access token using secure cookie | Public |
| `POST` | `/api/auth/logout` | Invalidate active session and clear cookie | Authenticated |

---

## 3. RAG & AI Chat Endpoints (`/api/chat`, `/api/rag`)

| Method | Endpoint | Description | Access Level |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat/message` | Submit message to AI Copilot (RAG + Agent) | All Roles |
| `GET` | `/api/chat/history` | Retrieve conversation session history | All Roles |
| `DELETE` | `/api/chat/history/:id` | Purge conversation history | User / Admin |
| `POST` | `/api/rag/ingest` | Process and vectorize approved document | Admin / SuperAdmin |
| `POST` | `/api/rag/query` | Test hybrid search (Vector + BM25 + Graph) | Support / Admin |

---

## 4. Ticket Lifecycle Endpoints (`/api/tickets`)

| Method | Endpoint | Description | Access Level |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets` | List tickets (scoped by tenant & branch) | All Roles |
| `POST` | `/api/tickets` | Create a new support ticket | All Roles |
| `GET` | `/api/tickets/:id` | Get ticket details and thread messages | Ticket Stakeholders |
| `POST` | `/api/tickets/:id/messages` | Post a reply to a ticket thread | Ticket Stakeholders |
| `PUT` | `/api/tickets/:id/status` | Update ticket status (`open`, `in_progress`, `resolved`, `closed`) | Support / Admin |
| `PUT` | `/api/tickets/:id/escalate` | Escalate ticket to higher tier | Support / Admin |
| `GET` | `/api/tickets/:id/ai-intelligence` | Fetch AI classification, summary & suggested reply | Support / Admin |

---

## 5. Organization & Admin Endpoints (`/api/organizations`, `/api/admin`)

| Method | Endpoint | Description | Access Level |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/organizations/settings` | Get organization brand, AI providers & quotas | Admin / SuperAdmin |
| `PUT` | `/api/organizations/settings` | Update AI providers, LLM keys, and brand colors | Admin / SuperAdmin |
| `POST` | `/api/organizations/api-keys` | Generate new scoped organization API key | Admin / SuperAdmin |
| `GET` | `/api/admin/metrics` | Retrieve resolution times, ticket volume & SLA stats | Admin / SuperAdmin |
| `GET` | `/api/admin/ai-intelligence` | Retrieve global LLM latency, token counts & accuracy | Admin / SuperAdmin |

---

## 6. Real-Time WebSocket Events (`Socket.io`)

### Client-to-Server Events
- `ticket:join` `(ticketId)`: Join ticket live room.
- `ticket:leave` `(ticketId)`: Leave ticket live room.
- `ticket:message` `({ ticketId, message })`: Send message.
- `ticket:typing` `({ ticketId, isTyping })`: Broadcast typing state.

### Server-to-Client Events
- `ticket:message:received`: Broadcasts new message to room subscribers.
- `ticket:typing:update`: Updates agent/customer typing indicators.
- `ticket:ai_stream:chunk`: Streams real-time tokens during AI generation.
- `notification:new`: Dispatches instant notification alert to specific user.
