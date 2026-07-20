# Flow Documentation - Bugs, Errors, Flow Gaps, Implementation Needs

## Bugs Fixed During Implementation

### 1. Missing Import in Chat Controller
- **File**: `server/modules/chat/chat.controller.js`
- **Issue**: Missing Message model import
- **Fix**: Added `import Message from "../message/message.schema.js"`
- **Impact**: Chat controller functions could not create messages

### 2. Missing Queue Configuration
- **File**: `server/config/queue.js`
- **Issue**: File did not exist, referenced in workers
- **Fix**: Created queue.js with BullMQ configuration for RAG, notification, and email queues
- **Impact**: RAG worker could not initialize properly

### 3. Missing Environment Variables
- **File**: `server/config/env.js`
- **Issue**: Missing REDIS_URL, CHROMA_URL, GOOGLE_AI_API_KEY, SENDGRID_API_KEY, CLIENT_URL
- **Fix**: Added all missing environment variables with defaults
- **Impact**: Services could not connect to Redis, ChromaDB, or other external services

### 4. Document Schema Incomplete
- **File**: `server/modules/document/document.schema.js`
- **Issue**: Missing fields per PLAN.md (chunk_ids, verified_by, verified_at, access_count, rag_queued_at)
- **Fix**: Added all missing fields and made file_data optional for cloud storage
- **Impact**: Document tracking and RAG pipeline incomplete

### 5. Login Response Mismatch
- **File**: `server/modules/auth/auth.controller.js`
- **Issue**: Response used `token` instead of `access_token`, missing `ui_config`
- **Fix**: Updated to return `access_token` and include `ui_config` from auth service
- **Impact**: Frontend could not receive authentication token or UI configuration

### 6. Frontend Login Token Handling
- **File**: `client/frontend/src/context/AuthContext.tsx`
- **Issue**: Expected `token` but backend returns `access_token`
- **Fix**: Updated to handle both `access_token` and `token`, store `ui_config`
- **Impact**: Login would fail, UI not configured

### 7. Missing Customer Dashboard Route
- **File**: `client/frontend/src/App.tsx`
- **Issue**: Customer dashboard route not defined
- **Fix**: Added `ROUTES.CUSTOMER.DASHBOARD` route
- **Impact**: Customers could not access dashboard after login

## Current Issues / Known Problems

### 1. Redis Connection Failure
- **Location**: `server/workers/rag.worker.js`
- **Error**: Redis connection refused, RAG worker paused
- **Impact**: Document RAG processing queued but not processed
- **Status**: Server continues without queue worker (graceful degradation)
- **Resolution Needed**: Start Redis server or configure Redis URL

### 2. Frontend Port Conflict
- **Location**: `client/frontend`
- **Issue**: Port 5173 in use, Vite switched to 5174
- **Impact**: Frontend URL differs from expected
- **Status**: Updated .env to reflect port 5174
- **Resolution Needed**: Kill process on port 5173 or accept 5174

### 3. ChromaDB Connection Unverified
- **Location**: `server/services/chroma.service.js`
- **Issue**: ChromaDB connection not tested
- **Impact**: Vector storage may fail if ChromaDB not running
- **Status**: Service has fallback to MongoDB storage
- **Resolution Needed**: Start ChromaDB server or verify connection

## Flow Gaps Identified

### 1. RAG Pipeline Flow
- **Gap**: Document upload → Queue → Worker → ChromaDB → Search
- **Status**: Implemented but not tested end-to-end
- **Missing**: Document upload endpoint integration with queue
- **Needed**: Test document upload and verify RAG processing

### 2. AI Chat Streaming Flow
- **Gap**: User message → RAG query → LLM → SSE stream → Frontend
- **Status**: Backend implemented, frontend SSE client not verified
- **Missing**: Frontend EventSource integration
- **Needed**: Test SSE streaming in chat interface

### 3. Ticket Escalation Flow
- **Gap**: Chat → Escalate → Ticket creation → Assignment
- **Status**: Backend implemented
- **Missing**: Frontend escalation UI
- **Needed**: Add escalation button in chat interface

### 4. Global Search Flow
- **Gap**: Search query → Multi-index search → Results aggregation
- **Status**: Backend implemented
- **Missing**: Frontend search UI
- **Needed**: Implement search interface in admin/support portals

## Implementation Needs

### Priority 1: Testing
- [ ] Test user registration and login flow
- [ ] Test customer dashboard loading
- [ ] Test document upload and RAG processing
- [ ] Test AI chat with RAG context
- [ ] Test ticket creation and management
- [ ] Test global search functionality
- [ ] Test notification delivery

### Priority 2: Redis Setup
- [ ] Install and start Redis server
- [ ] Configure REDIS_URL in .env
- [ ] Verify RAG worker connection
- [ ] Test document processing queue

### Priority 3: ChromaDB Setup
- [ ] Install and start ChromaDB server
- [ ] Configure CHROMA_URL in .env
- [ ] Test vector storage and retrieval
- [ ] Verify RAG query performance

### Priority 4: Frontend Integration
- [ ] Implement SSE client for AI chat streaming
- [ ] Add escalation button in chat interface
- [ ] Implement global search UI
- [ ] Integrate branding from ui_config
- [ ] Add notification bell with unread count

### Priority 5: Security Hardening
- [ ] Implement rate limiting per user
- [ ] Add request signing for API calls
- [ ] Implement CSRF protection
- [ ] Add input sanitization for all endpoints
- [ ] Implement audit log retention policy

## Architecture Notes

### Backend-Driven UI Flow
1. User logs in → Backend returns `ui_config` with:
   - Branding (colors, logo, fonts)
   - Navigation (role-based menu items)
   - Permissions (feature flags)
   - Limits (file size, upload count)

2. Frontend stores `ui_config` in localStorage
3. BrandingInjector applies CSS variables from config
4. Navigation renders based on role permissions
5. Features enabled/disabled based on config flags

### RAG Pipeline Flow
1. Document uploaded → `rag_status: pending`
2. Job added to BullMQ queue `rag-pipeline`
3. Worker processes:
   - Text extraction (PDF, DOCX, TXT)
   - Chunking (configurable size/overlap)
   - Embedding generation (Groq or local)
   - Vector upsert to ChromaDB
   - Fallback to MongoDB if ChromaDB unavailable
4. Document `rag_status: completed` or `failed`

### Ticket SLA Flow
1. Ticket created with priority
2. SLA due date set based on priority:
   - Urgent: 4 hours
   - High: 8 hours
   - Medium: 24 hours
   - Low: 72 hours
3. Cron job checks every 15 minutes for overdue tickets
4. SLA breached flag set if due_date passed
5. Notifications sent for SLA breaches

## Next Steps

1. **Immediate**: Start Redis server to enable RAG processing
2. **Short-term**: Test all user flows end-to-end
3. **Medium-term**: Implement missing frontend UI components
4. **Long-term**: Add monitoring, analytics, and performance optimization
