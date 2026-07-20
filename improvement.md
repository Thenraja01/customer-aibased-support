# AI Customer Support Portal — Improvement Plan

## Priority 1: RAG Pipeline & AI Integration (Phase 3)

### P1.1 BullMQ Workers for Document Ingestion
**Gap**: Current RAG processing uses `setImmediate` — no retry, queue, or scaling.

**Required**:
- Set up BullMQ queue `rag-pipeline:{org_id}` with Redis
- Create worker: text extraction → chunking → embedding → vector upsert
- Add job retry (3 attempts, exponential backoff)
- Track status per document (`pending` → `processing` → `completed`/`failed`)

**Files**: `server/workers/rag.worker.js`, `server/config/queue.js`

### P1.2 Pinecone Vector DB Integration
**Gap**: Vectors stored in MongoDB (no dedicated vector DB, poor performance at scale).

**Required**:
- Set up Pinecone client with org-scoped namespaces (`org_{org_id}`)
- Implement upsert (batch) and query operations
- Fall back to MongoDB when Pinecone unavailable
- Include metadata: `{ doc_id, chunk_index, page, org_id }`

**Files**: `server/services/pinecone.service.js`

### P1.3 SSE Streaming for AI Chat
**Gap**: No streaming endpoint — chat responses return as complete blocks.

**Required**:
- Implement `GET /chats/:id/stream` SSE endpoint
- Stream from Grok/Gemini APIs with RAG context injected
- Client-side `EventSource` handler

**Files**: `server/modules/chat/chat.controller.js`, `server/modules/chat/chat.route.js`

### P1.4 AI Provider Wiring with RAG
**Gap**: Grok/Gemini services exist but not wired into chat flow with RAG context.

**Required**:
- RAG query → embed → search → construct prompt → LLM call → stream response
- Fallback message when no relevant chunks found
- Token usage tracking per interaction

**Files**: `server/services/rag.service.js`, `server/modules/chat/`

### P1.5 Token Usage & Chat Analytics
**Gap**: No tracking of tokens used, response times, or user satisfaction.

**Required**:
- Track tokens per message and per session
- Update `chat_analytics` collection async after each interaction
- Store RAG chunk references in message metadata

**Files**: `server/modules/chat-analytics/`

---

## Priority 2: Ticket System & Search (Phase 4)

### P2.1 Complete Ticket CRUD
**Gap**: Ticket module exists but needs full assignment, status workflow, priority.

**Required**:
- Assign tickets to support agents
- Status workflow: open → in_progress → resolved → closed
- Priority management (low/medium/high/urgent)
- Due date tracking with SLA alerts

### P2.2 Chat-to-Ticket Escalation
**Gap**: No way to escalate a chat to a ticket.

**Required**:
- `POST /chats/:id/escalate` endpoint
- Copy chat context into ticket description
- Notify support team

### P2.3 Global Search
**Gap**: No search endpoints exist.

**Required**:
- MongoDB Atlas full-text search indexes
- `GET /search?q=&type=` endpoint
- Role-scoped results per org

---

## Priority 3: Core Backend Completion (Phase 2 gaps)

### P3.1 User CRUD with RBAC
**Gap**: User routes exist but full CRUD with admin role assignment incomplete.

### P3.2 Soft Delete on All Collections
**Gap**: Not all 24 collections implement `is_deleted` / `deleted_at`.

### P3.3 Notification Service
**Gap**: In-app notifications exist, but email (SendGrid) integration missing.

### P3.4 File Upload Security
**Gap**: No ClamAV virus scan, weak MIME validation, no org-level size enforcement.

### P3.5 Redis Caching
**Gap**: No Redis client — org config loaded from DB on every request.

### P3.6 OpenAPI Docs
**Gap**: No swagger setup or route documentation.

---

## Priority 4: Frontend (Phase 5)

### P4.1 Bootstrap Flow
**Gap**: ui_config returned from login but frontend bootstrap not fully wired.

### P4.2 Customer Portal
**Gap**: Basic pages exist but streaming chat, full ticket flow, and document management need completion.

### P4.3 Admin Portal
**Gap**: Management screens, analytics charts, and org settings not built.

### P4.4 Support Portal
**Gap**: Ticket queue, document verification queue not built.
