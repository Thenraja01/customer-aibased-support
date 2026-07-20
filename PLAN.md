# AI Customer Support Portal
## Complete Project Prompt — Multi-Tenant · RAG-First · RBAC · Backend-Driven UI

---

## 1. Project Vision

Build a **production-ready, multi-tenant AI Customer Support Portal** where every organization gets an isolated, configurable AI chatbot grounded exclusively in their own uploaded documents. The system enforces **strict role-based access control (RBAC)** at every layer, and the **UI itself is driven by backend configuration** — meaning feature visibility, navigation items, color themes, and available modules change dynamically per organization and per role without any frontend code changes.

---

## 2. Core Architectural Pillars

### 2.1 Multi-Tenancy (Hard Isolation)

Every single database query, file operation, vector search, and AI call **must** include `organization_id` as a mandatory scope. No cross-tenant data leak is acceptable at any level.

```
Tenant Isolation Layers:
─────────────────────────────────────────────────────
 Layer               Strategy
─────────────────────────────────────────────────────
 MongoDB             All collections: { organization_id: ObjectId, required }
 Pinecone/ChromaDB   Namespace per org: `org_{organization_id}`
 Redis Cache         Key prefix: `org:{org_id}:*`
 S3/Cloudinary       Path prefix: `/{org_id}/documents/...`
 BullMQ Queues       Separate queue name: `rag-pipeline:{org_id}`
 API Middleware      Extract org from JWT → inject into all service calls
─────────────────────────────────────────────────────
```

**Organization Config Schema** (drives backend-driven UI):
```javascript
organizations: {
  _id, name, slug, email, phone, address, logo_url, status,
  branding: {
    primary_color: String,       // e.g. "#2563EB"
    secondary_color: String,
    logo_url: String,
    favicon_url: String,
    app_name: String,            // White-label name shown in UI
    font_family: String
  },
  features: {                    // All UI modules gated here
    rag_enabled: Boolean,
    chat_enabled: Boolean,
    tickets_enabled: Boolean,
    knowledge_base_enabled: Boolean,
    document_verification_enabled: Boolean,
    analytics_enabled: Boolean,
    bulk_upload_enabled: Boolean,
    api_access_enabled: Boolean,
    sso_enabled: Boolean,
    two_factor_required: Boolean
  },
  limits: {
    max_users: Number,
    max_file_size_mb: Number,     // default 10
    max_uploads_per_day: Number,  // default 50
    max_knowledge_base_docs: Number,
    max_rag_chunks: Number,       // default 500 per doc
    max_chat_sessions: Number,
    max_ticket_count: Number
  },
  ai_config: {
    model: String,                // "claude-sonnet-4-6" | "gpt-4o"
    temperature: Number,
    max_tokens: Number,
    system_prompt_override: String,  // Org-specific AI persona
    fallback_message: String,        // When RAG has no answer
    chunk_size: Number,
    chunk_overlap: Number,
    top_k_retrieval: Number,
    similarity_threshold: Number
  },
  allowed_file_types: [String],
  created_at, updated_at, is_deleted
}
```

### 2.2 RAG Pipeline (Document-Grounded AI)

The AI **must never hallucinate**. Every response is either grounded in retrieved document chunks or returns the configured `fallback_message`. No exceptions.

```
RAG Pipeline Flow:
──────────────────────────────────────────────────────────────────────
 [Document Upload]
      │
      ▼
 [File Validation] → MIME check, size check, virus scan (ClamAV)
      │
      ▼
 [Text Extraction] → PDF: pdfjs | DOCX: mammoth | Images: Tesseract OCR
      │
      ▼
 [Preprocessing] → strip HTML, normalize whitespace, deduplicate
      │
      ▼
 [Content Hashing] → SHA-256 of extracted text → detect duplicates early
      │
      ▼
 [Chunking] → 512-token chunks, 50-token overlap, preserve sentence boundaries
      │
      ▼
 [Embedding] → text-embedding-3-small (OpenAI) | voyage-2 (Anthropic)
      │
      ▼
 [Vector Storage] → chorma namespace: org_{org_id}, metadata: {doc_id, chunk_index, page}
      │
      ▼
 [Status Update] → documents.rag_status = 'completed' | 'failed' + rag_error
──────────────────────────────────────────────────────────────────────

 [User Chat Query]
      │
      ▼
 [Query Embedding] → same model as ingestion
      │
      ▼
 [Similarity Search] → chorma namespace: org_{org_id}, top_k = 5, threshold = 0.75
      │
      ├─── No results above threshold ──► Return org.ai_config.fallback_message
      │
      ▼
 [Prompt Construction]
      │    System: You are {org.branding.app_name} support AI.
      │            Answer ONLY using the provided context.
      │            If context is insufficient, say: "{fallback_message}"
      │            Context: [chunk_1]...[chunk_5]
      │
      ▼
 [LLM Call] → Streaming SSE response
      │
      ▼
 [Response Sanitization] → strip PII, log tokens_used, rag_chunks_used
      │
      ▼
 [Analytics Update] → ai_sessions, chat_analytics collections
──────────────────────────────────────────────────────────────────────
```

**Documents Collection** (RAG tracking fields mandatory):
```javascript
documents: {
  _id, organization_id, user_id, document_type_id,
  title, description, file_name, file_path, file_key,
  file_mimetype, file_size,
  content_hash: String,              // SHA-256, unique per org
  is_knowledge_base: Boolean,        // true = used in RAG
  rag_status: 'pending'|'processing'|'completed'|'failed',
  rag_error: String,
  rag_queued_at: Date,
  processed_at: Date,
  total_chunks: Number,
  chunk_ids: [String],               // chorma vector IDs
  version: Number,
  previous_version_id: ObjectId,
  status: 'pending'|'approved'|'rejected',
  verified_by: ObjectId, verified_at: Date,
  tags: [String], category_id: ObjectId,
  access_count: Number,
  is_deleted: Boolean, deleted_at: Date,
  created_at, updated_at
}
```

### 2.3 Role-Based Access Control (RBAC)

Four roles with strictly enforced permissions at **middleware level**, not frontend-only.

```
Role Hierarchy & Permissions:
──────────────────────────────────────────────────────────────────────────────
 Resource              super_admin  admin    support   customer
──────────────────────────────────────────────────────────────────────────────
 Organizations         CRUD         R(own)   R(own)    -
 Users                 CRUD(all)    CRUD     R(own)    R(own)
 Documents(KnowledgeBase) CRUD      CRUD     R         -
 Documents(KYC)        R(all)       R(all)   RU(verify) CRUD(own)
 Chats                 R(all)       R(all)   R(all)    CRUD(own)
 Messages              R(all)       R(all)   R(all)    CRUD(own)
 Tickets               CRUD(all)    CRUD     CRUD      CR(own)
 Analytics             R(all)       R(org)   R(own)    -
 Audit Logs            R(all)       R(org)   -         -
 System Config         CRUD         -        -         -
 Org Config/Branding   -            CRUD     -         -
 Notifications         CRUD(all)    CRD(org) -         R(own)
──────────────────────────────────────────────────────────────────────────────
```

**RBAC Middleware Stack** (applied to every route):
```javascript
// Order matters — execute in sequence:
1. authenticateJWT()          → verify token, decode user
2. attachOrganization()       → load org config from Redis/DB, inject req.org
3. enforceOrgScope()          → verify user.organization_id === req.org._id
4. checkFeatureFlag(feature)  → verify org.features[feature] === true
5. authorizeRole(...roles)    → verify user.role is in allowed roles
6. checkResourceOwnership()   → for customer role, verify resource.user_id === user._id
```

### 2.4 Backend-Driven UI

The frontend **never hardcodes navigation, features, or themes**. On login, the backend returns a `ui_config` payload that the frontend renders. This allows per-org white-labeling and per-role UI without frontend deployments.

**`/api/v1/auth/login` response** (drives entire UI):
```json
{
  "access_token": "...",
  "user": { "id", "name", "email", "role", "avatar_url" },
  "ui_config": {
    "branding": {
      "app_name": "Acme Support",
      "primary_color": "#1D4ED8",
      "secondary_color": "#7C3AED",
      "logo_url": "https://cdn.example.com/acme/logo.png",
      "font_family": "Inter"
    },
    "navigation": [
      { "id": "dashboard", "label": "Dashboard", "icon": "grid", "path": "/dashboard", "visible": true },
      { "id": "chat",      "label": "AI Chat",   "icon": "message", "path": "/chat",  "visible": true },
      { "id": "documents", "label": "Documents", "icon": "file",    "path": "/docs",  "visible": true },
      { "id": "tickets",   "label": "Tickets",   "icon": "ticket",  "path": "/tickets","visible": true },
      { "id": "users",     "label": "Users",     "icon": "users",   "path": "/users", "visible": false },
      { "id": "analytics", "label": "Analytics", "icon": "chart",   "path": "/analytics","visible": false },
      { "id": "settings",  "label": "Settings",  "icon": "gear",    "path": "/settings","visible": false }
    ],
    "permissions": {
      "can_upload_documents": true,
      "can_verify_documents": false,
      "can_manage_users": false,
      "can_view_analytics": false,
      "can_broadcast_notifications": false,
      "can_configure_ai": false,
      "can_export_data": false,
      "can_bulk_upload": false
    },
    "features": {
      "rag_enabled": true,
      "tickets_enabled": true,
      "knowledge_base_visible": false,
      "document_verification_visible": false
    },
    "limits": {
      "max_file_size_mb": 10,
      "allowed_file_types": ["pdf", "docx", "jpg", "png"]
    }
  }
}
```

**Frontend rendering rule**: Every component checks `ui_config` before rendering. No hardcoded role strings in React components. Navigation, buttons, and entire page sections render or hide based solely on `ui_config.permissions` and `ui_config.features`.

---

## 3. Technology Stack

### Backend
```
Runtime:          Node.js 20+ (TypeScript)
Framework:        Express.js with modular router architecture
Database:         MongoDB Atlas (Mongoose ODM, M10+ tier)
Vector DB:        chorma (dedicated tier, one namespace per org)
Cache:            Redis 7 (ioredis) — sessions, org config, rate limits
Queue:            BullMQ + Redis — RAG pipeline, email, notifications
File Storage:     AWS S3 or Cloudinary (org-prefixed paths)
AI/LLM:          Anthropic Claude Sonnet 4.6 (primary), OpenAI fallback
Embeddings:       OpenAI text-embedding-3-small
Streaming:        SSE (Server-Sent Events) for AI chat responses
Auth:             JWT (access: 15min, refresh: 7d), HTTP-only cookies
Email:            SendGrid (transactional templates)
Real-time:        Socket.IO (notifications, typing indicators)
Text Extraction:  pdfjs-dist, mammoth (DOCX), Tesseract.js (OCR)
Virus Scan:       ClamAV (file upload middleware)
Logging:          Winston + Morgan
Validation:       Zod (schema validation on all inputs)
Testing:          Jest + Supertest
Documentation:    OpenAPI 3.0 (swagger-jsdoc + swagger-ui-express)
```

### Frontend
```
Framework:        React 18 (TypeScript) + Vite
State:            Redux Toolkit (global state) + React Query (server state)
UI:               Tailwind CSS (utility) + Shadcn/UI (components)
Routing:          React Router v6
Forms:            React Hook Form + Zod
HTTP:             Axios (interceptors for token refresh, org header injection)
Real-time:        Socket.IO client
Charts:           Recharts
Streaming:        EventSource API (SSE for AI responses)
Testing:          Vitest + React Testing Library + Playwright (E2E)
```

### DevOps
```
Containerization: Docker + Docker Compose (dev), Kubernetes (prod)
CI/CD:            GitHub Actions
IaC:              Terraform (AWS EKS, RDS, ElastiCache, S3)
Monitoring:       Prometheus + Grafana
Logging:          Loki + Grafana or ELK Stack
Secrets:          AWS Secrets Manager / HashiCorp Vault
```

---

## 4. Complete Database Schema

### All Collections (24 total)

#### Core Identity
```javascript
// 1. organizations — already defined above in Section 2.1

// 2. users
{
  _id, organization_id (indexed), role, name, email (unique),
  phone, password (bcrypt, rounds=12), dob, avatar_url,
  auth_type: 'local'|'google'|'github',
  status: 'active'|'inactive'|'blocked',
  preferences: {
    theme: 'light'|'dark', language, timezone,
    notifications: { email, push, in_app,
      document_verified, ticket_assigned, ticket_resolved, message_received }
  },
  last_login, login_count, last_active_at,
  is_email_verified, email_verified_at,
  reset_password_token, reset_password_expires,
  two_factor_secret, two_factor_enabled,
  is_deleted, deleted_at, created_at, updated_at
}

// 3. user_sessions
{
  _id, user_id (indexed), refresh_token,
  ip_address, user_agent, device_info,
  expires_at (TTL index), is_revoked,
  created_at
}

// 4. api_usage
{
  _id, organization_id (indexed), user_id (indexed),
  endpoint, method, status_code, response_time_ms,
  ip_address, user_agent,
  created_at (TTL: 30d, indexed)
}
```

#### Document Management
```javascript
// 5. documents — defined above in Section 2.2

// 6. document_types
{
  _id, organization_id (indexed),
  name (unique per org), description,
  requires_verification: Boolean,
  is_knowledge_base_type: Boolean,
  allowed_mimetypes: [String],
  is_active, created_at, updated_at
}

// 7. document_categories
{
  _id, organization_id (indexed),
  name, description, color, icon,
  is_active, created_at
}

// 8. document_chunks (for reference/debugging; vectors live in Pinecone)
{
  _id, document_id (indexed), organization_id (indexed),
  chunk_index, content, content_hash,
  token_count, vector_id (chorma ID),
  metadata: { page_number, section, paragraph },
  created_at
}

// 9. document_verifications
{
  _id, document_id (indexed), organization_id (indexed),
  verified_by, status: 'pending'|'approved'|'rejected',
  remarks, created_at, updated_at
}

// 10. document_shares
{
  _id, document_id (indexed), organization_id,
  shared_by, shared_with (indexed),
  permission: 'view'|'download',
  expires_at (indexed), created_at
}

// 11. document_comments
{
  _id, document_id (indexed), organization_id,
  user_id, comment (max 1000),
  parent_id (for threading), is_resolved,
  created_at, updated_at
}

// 12. bulk_operations
{
  _id, organization_id (indexed), user_id,
  operation_type: 'upload'|'delete'|'verify'|'reindex',
  status: 'pending'|'processing'|'completed'|'failed',
  total_records, processed_records, failed_records,
  error_log: [{ record_id, error, created_at }],
  created_at, completed_at
}
```

#### Chat & AI
```javascript
// 13. chats
{
  _id, organization_id (indexed), user_id (indexed),
  assigned_to, topic,
  status: 'open'|'closed'|'escalated' (indexed),
  priority: 'low'|'medium'|'high'|'urgent',
  metadata: { source, user_agent, ip_address },
  is_deleted, deleted_at, created_at, updated_at
}

// 14. messages
{
  _id, chat_id (indexed), organization_id (indexed),
  sender_id, sender_type: 'user'|'ai'|'system',
  content, message_type: 'text'|'file'|'system',
  file_url, file_name, is_ai (indexed),
  feedback: 'helpful'|'not_helpful', feedback_comment,
  metadata: { tokens_used, response_time_ms, model_used, rag_chunks_used: [String] },
  created_at, updated_at
  // Compound index: (chat_id, created_at DESC)
}

// 15. chat_analytics
{
  _id, chat_id (unique), organization_id (indexed),
  total_messages, ai_messages, human_messages,
  avg_response_time_ms, total_tokens_used,
  user_satisfaction: { helpful, not_helpful },
  first_response_time_ms, resolution_time_ms,
  escalation_count, created_at, updated_at
}

// 16. ai_sessions
{
  _id, chat_id (indexed), organization_id (indexed),
  model, total_tokens_used, messages_count,
  interactions: [{
    query, response_summary, intent,
    rag_chunks_used: [String],
    response_time_ms, tokens_used, created_at
  }],
  created_at, updated_at
}
```

#### Tickets
```javascript
// 17. tickets
{
  _id, organization_id (indexed), user_id (indexed),
  assigned_to (indexed), chat_id,
  subject, description, category, tags: [String],
  status: 'open'|'in_progress'|'resolved'|'closed' (indexed),
  priority: 'low'|'medium'|'high'|'urgent',
  due_date, resolved_at, resolution_notes,
  escalation_count,
  is_deleted, deleted_at, created_at, updated_at
  // Compound index: (organization_id, assigned_to, status)
}

// 18. ticket_comments
{
  _id, ticket_id (indexed), organization_id,
  user_id, comment, is_internal,
  attachments: [{ file_name, file_url, file_key }],
  created_at, updated_at
}
```

#### Notifications & Config
```javascript
// 19. notifications
{
  _id, user_id (indexed), organization_id,
  type: 'info'|'success'|'warning'|'error',
  title, message, link, data: Object,
  is_read (indexed), read_at,
  created_at
  // Compound index: (user_id, is_read, created_at DESC)
}

// 20. notification_preferences
{
  _id, user_id (unique, indexed),
  email_notifications, push_notifications, in_app_notifications,
  preferences: {
    document_verified, ticket_assigned, ticket_resolved,
    message_received, system_updates
  },
  updated_at
}

// 21. audit_logs
{
  _id, user_id (indexed), organization_id (indexed),
  action, resource, resource_id,
  old_value: Object, new_value: Object,
  changes: [{ field, old_value, new_value }],
  ip_address, user_agent, metadata: Object,
  created_at (indexed, TTL: 90d)
}

// 22. faqs
{
  _id, organization_id (indexed),
  question, answer, category,
  is_active (indexed), created_at, updated_at
}

// 23. system_config
{
  _id, key (unique), value: Mixed,
  description, is_editable,
  created_at, updated_at
}

// Seed values:
// max_file_size_mb: 10, chunk_size: 512, chunk_overlap: 50,
// similarity_threshold: 0.75, top_k_retrieval: 5,
// ai_model: "claude-sonnet-4-6", vector_dimension: 1536

// 24. document_access_control
{
  _id, document_id (indexed), organization_id,
  role_id, user_id, permission: 'view'|'edit'|'delete'|'verify',
  created_at
}
```

### Required Indexes (all mandatory before go-live)
```javascript
// Performance-critical compound indexes:
messages.createIndex({ chat_id: 1, created_at: -1 });
messages.createIndex({ organization_id: 1, is_ai: 1, created_at: -1 });
notifications.createIndex({ user_id: 1, is_read: 1, created_at: -1 });
tickets.createIndex({ organization_id: 1, assigned_to: 1, status: 1 });
tickets.createIndex({ organization_id: 1, status: 1, priority: 1 });
documents.createIndex({ organization_id: 1, status: 1, rag_status: 1 });
documents.createIndex({ organization_id: 1, is_knowledge_base: 1 });
documents.createIndex({ content_hash: 1, organization_id: 1 }); // duplicate detection
chats.createIndex({ organization_id: 1, status: 1, updated_at: -1 });
audit_logs.createIndex({ organization_id: 1, action: 1, created_at: -1 });
```

---

## 5. Complete API Specification

All endpoints are prefixed with `/api/v1`. All responses follow:
```json
{ "success": true|false, "data": {}, "message": "", "errors": [], "meta": { "page", "limit", "total" } }
```

### Authentication
```
POST   /auth/register              Public
POST   /auth/login                 Public → returns ui_config
POST   /auth/oauth/google          Public
POST   /auth/oauth/github          Public
POST   /auth/refresh               Public (refresh token in cookie)
POST   /auth/logout                Authenticated
POST   /auth/forgot-password       Public
POST   /auth/reset-password        Public
POST   /auth/verify-email          Public
GET    /auth/ui-config             Authenticated → re-fetch ui_config
```

### Organizations (super_admin only)
```
GET    /organizations              List all
POST   /organizations              Create
GET    /organizations/:id          Get details
PUT    /organizations/:id          Update (config, branding, features, limits)
DELETE /organizations/:id          Soft delete
GET    /organizations/:id/stats    Usage statistics
POST   /organizations/:id/suspend  Suspend org
```

### Users
```
GET    /users                      [admin+] Paginated list with filters
POST   /users                      [admin] Create user
GET    /users/:id                  [admin+ | own]
PUT    /users/:id                  [admin | own for profile fields]
DELETE /users/:id                  [admin] Soft delete
PATCH  /users/:id/status           [admin] active|inactive|blocked
PUT    /users/:id/avatar           [own] Upload avatar
PUT    /users/:id/password         [own] Change password
GET    /users/:id/activity         [admin | own]
```

### Documents
```
POST   /documents                  [all] Upload single (multipart/form-data)
POST   /documents/bulk             [admin, support] Bulk upload
GET    /documents                  [all] Paginated, filtered by role+org scope
GET    /documents/:id              [all] Role-scoped
PUT    /documents/:id              [admin | owner]
DELETE /documents/:id              [admin | owner] Soft delete + remove vectors
PATCH  /documents/:id/verify       [admin, support] Approve with remarks
PATCH  /documents/:id/reject       [admin, support] Reject with remarks
POST   /documents/:id/reindex      [admin] Re-run RAG pipeline
GET    /documents/:id/chunks       [admin] View parsed chunks
GET    /documents/:id/download     [all] Signed URL (15min expiry)
GET    /documents/rag-status       [admin] Pipeline status overview

POST   /documents/types            [admin] Create type
GET    /documents/types            [all]
PUT    /documents/types/:id        [admin]
DELETE /documents/types/:id        [admin]

POST   /documents/categories       [admin]
GET    /documents/categories       [all]
```

### Chat
```
POST   /chats                      [customer, support] Create session
GET    /chats                      [all] Role-scoped
GET    /chats/:id                  [all] Role-scoped
DELETE /chats/:id                  [admin | owner] Soft delete
POST   /chats/:id/escalate         [all] Create ticket from chat
GET    /chats/:id/summary          [all] AI-generated summary

POST   /chats/:id/messages         [all] Send message (triggers RAG)
GET    /chats/:id/messages         [all] Paginated history
PATCH  /chats/:id/messages/:msgId/feedback  [customer] helpful|not_helpful

GET    /chats/:id/stream           [all] SSE endpoint for AI streaming
```

### Tickets
```
POST   /tickets                    [all] Create
GET    /tickets                    [all] Role-scoped
GET    /tickets/:id                [all] Role-scoped
PUT    /tickets/:id                [admin, support]
DELETE /tickets/:id                [admin] Soft delete
PATCH  /tickets/:id/assign         [admin, support] Assign to agent
PATCH  /tickets/:id/status         [admin, support]
PATCH  /tickets/:id/priority       [admin, support]

POST   /tickets/:id/comments       [all]
GET    /tickets/:id/comments       [all]
PUT    /tickets/:id/comments/:cid  [owner]
DELETE /tickets/:id/comments/:cid  [admin | owner]
```

### Notifications
```
GET    /notifications              [all] Own notifications
GET    /notifications/unread-count [all]
PATCH  /notifications/:id/read     [all]
PATCH  /notifications/read-all     [all]
DELETE /notifications/:id          [all]
POST   /notifications/broadcast    [admin] Org-wide broadcast
PUT    /notifications/preferences  [all] Update preferences
```

### Analytics
```
GET    /analytics/dashboard        [admin+] KPI overview
GET    /analytics/ai               [admin] Token usage, cost, sessions
GET    /analytics/documents        [admin] Upload/verification metrics
GET    /analytics/chat             [admin] Volume, satisfaction, response time
GET    /analytics/tickets          [admin] Resolution times, volume by status
GET    /analytics/users            [admin] Active users, role distribution
POST   /analytics/export           [admin] Generate CSV/PDF report
```

### Search
```
GET    /search?q=&type=            [all] Global search (role-scoped)
GET    /search/documents?q=        [all]
GET    /search/chats?q=            [admin, support]
GET    /search/tickets?q=          [all]
GET    /search/users?q=            [admin+]
```

### Admin
```
GET    /admin/audit-logs           [admin+]
GET    /admin/system-config        [super_admin]
PUT    /admin/system-config/:key   [super_admin]
GET    /admin/queue-status         [super_admin] BullMQ job status
POST   /admin/reprocess-failed     [admin] Retry failed RAG jobs
GET    /admin/org-config           [admin] Get own org config
PUT    /admin/org-config           [admin] Update branding, features, ai_config, limits
```

---

## 6. Backend-Driven UI — Frontend Implementation Contract

### 6.1 App Bootstrap Flow
```
1. App loads → check localStorage for access_token
2. If token exists → GET /auth/ui-config → store ui_config in Redux
3. Render <App> → inject CSS variables from ui_config.branding
4. Render <Sidebar> → map ui_config.navigation, filter visible: true
5. Every route component → check ui_config.permissions before rendering
6. Every button/action → check ui_config.permissions[can_*] before showing
```

### 6.2 CSS Variable Injection (on login)
```javascript
// Runs once on ui_config received, updates on org switch
function applyBranding(branding) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', branding.primary_color);
  root.style.setProperty('--color-secondary', branding.secondary_color);
  root.style.setProperty('--font-family', branding.font_family);
  document.title = branding.app_name;
  // Update favicon dynamically
  document.querySelector('link[rel="icon"]').href = branding.favicon_url;
}
```

### 6.3 Permission Guard Component
```tsx
// Wrap any UI element with this — no role strings in component code
function Can({ permission, feature, children }) {
  const { permissions, features } = useSelector(state => state.uiConfig);
  if (permission && !permissions[permission]) return null;
  if (feature && !features[feature]) return null;
  return children;
}

// Usage — zero role logic in component:
<Can permission="can_verify_documents">
  <Button onClick={handleVerify}>Verify Document</Button>
</Can>

<Can feature="analytics_enabled">
  <NavItem path="/analytics" label="Analytics" />
</Can>
```

### 6.4 Axios Interceptor Setup
```javascript
// Automatically attaches org context to every request
axios.interceptors.request.use(config => {
  const { accessToken, orgId } = store.getState().auth;
  config.headers.Authorization = `Bearer ${accessToken}`;
  config.headers['X-Organization-ID'] = orgId; // belt-and-suspenders
  return config;
});

// Handle token refresh transparently
axios.interceptors.response.use(null, async error => {
  if (error.response?.status === 401 && !error.config._retry) {
    error.config._retry = true;
    await store.dispatch(refreshTokenThunk());
    return axios(error.config);
  }
  return Promise.reject(error);
});
```

---

## 7. RAG Pipeline Implementation Detail

### 7.1 BullMQ Job Definitions
```javascript
// Queue: "rag-pipeline:{org_id}"
// Jobs:
{
  name: 'ingest-document',
  data: { document_id, organization_id, file_key, mimetype },
  opts: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
}

// Worker steps (each logged to document.rag_status):
async function processDocument(job) {
  const { document_id, organization_id } = job.data;
  await updateRagStatus(document_id, 'processing');
  try {
    const text = await extractText(job.data);                  // step 1
    const hash = sha256(text);
    await checkDuplicate(hash, organization_id);               // step 2
    const chunks = chunkText(text, { size: 512, overlap: 50 });// step 3
    const embeddings = await generateEmbeddings(chunks);       // step 4
    await upsertToPinecone(organization_id, document_id, chunks, embeddings); // step 5
    await updateRagStatus(document_id, 'completed', { total_chunks: chunks.length });
  } catch (err) {
    await updateRagStatus(document_id, 'failed', { rag_error: err.message });
    throw err; // BullMQ retries
  }
}
```

### 7.2 RAG Query with Streaming
```javascript
async function* streamRagResponse(chatId, query, organization_id, orgConfig) {
  // 1. Embed query
  const queryEmbedding = await embed(query);

  // 2. Retrieve from org namespace
  const results = await pinecone
    .index('support-docs')
    .namespace(`org_${organization_id}`)
    .query({ vector: queryEmbedding, topK: orgConfig.ai_config.top_k_retrieval,
             includeMetadata: true, filter: { status: 'approved' } });

  // 3. Check threshold
  const relevant = results.matches.filter(
    m => m.score >= orgConfig.ai_config.similarity_threshold
  );
  if (relevant.length === 0) {
    yield orgConfig.ai_config.fallback_message;
    return;
  }

  // 4. Build context
  const context = relevant.map(m => m.metadata.content).join('\n\n---\n\n');

  // 5. Stream from Claude
  const stream = await anthropic.messages.stream({
    model: orgConfig.ai_config.model,
    max_tokens: orgConfig.ai_config.max_tokens,
    system: buildSystemPrompt(orgConfig, context),
    messages: await getChatHistory(chatId)
  });

  let fullResponse = '';
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      yield chunk.delta.text;
      fullResponse += chunk.delta.text;
    }
  }

  // 6. Persist message + analytics async
  setImmediate(() => persistMessageAndAnalytics(chatId, query, fullResponse, relevant));
}
```

---

## 8. Security Implementation

### 8.1 Middleware Chain (all protected routes)
```javascript
// Applied globally to all /api/v1/* except /auth/login, /auth/register
router.use(
  helmet(),                         // Security headers
  cors(corsOptions),                // Whitelist origins
  rateLimiter({ windowMs: 60000, max: 100 }),  // Per user
  authenticateJWT,                  // Decode + verify token
  attachOrganization,               // Load org config (Redis-first)
  enforceOrgActive,                 // 403 if org suspended
  logApiUsage                       // Write to api_usage collection async
);
```

### 8.2 File Upload Security
```javascript
// Every file upload goes through:
1. multer({ limits: { fileSize: org.limits.max_file_size_mb * 1024 * 1024 } })
2. checkMimeType(file, org.allowed_file_types)    // Reject spoofed extensions
3. clamAVScan(file.buffer)                         // Virus scan
4. hashContent(file.buffer)                        // Duplicate detection
5. uploadToStorage(file, `/${org_id}/documents/`)  // Org-scoped path
6. enqueueRagJob(document_id, org_id)              // Non-blocking
```

### 8.3 Document Access (Signed URLs)
```javascript
// Documents are never publicly accessible
// All downloads go through:
GET /documents/:id/download
  → verify user can access this document (role + org scope)
  → generate pre-signed S3 URL (15 min expiry)
  → log access in audit_logs
  → return { signed_url, expires_at }
```

---

## 9. UI Screen Inventory

### Public
- Landing page (white-labeled per org if accessed via custom domain)
- Login, Register, Forgot Password, Reset Password, Verify Email

### Customer Portal (role: customer)
- `/dashboard` — Recent chats, document status, notifications
- `/chat` — New chat, chat history list
- `/chat/:id` — Active chat with streaming AI, file attachment, feedback
- `/documents` — Own KYC documents: upload, status, download
- `/tickets` — Own tickets: create, view, comment
- `/profile` — Info, avatar, password, notification preferences

### Support Portal (role: support)
- `/dashboard` — Assigned tickets KPIs, queue depth, recent activity
- `/tickets` — All org tickets, filter by status/priority/assignment
- `/tickets/:id` — Detail: assign, update status, add internal note
- `/documents/verify` — Verification queue: approve/reject with remarks
- `/chat/monitor` — View all active/escalated chats

### Admin Portal (role: admin)
- `/dashboard` — Full KPI: users, docs, chats, tickets, AI usage
- `/users` — CRUD users, assign roles, block/unblock
- `/documents` — All documents: KYC + knowledge base, bulk ops
- `/documents/knowledge-base` — RAG document management, reindex
- `/tickets` — Full ticket management
- `/analytics` — Usage charts, export reports
- `/notifications` — Broadcast, notification history
- `/audit-logs` — Filterable, exportable audit trail
- `/settings/organization` — Branding, features, limits, AI config
- `/settings/document-types` — CRUD document types
- `/settings/faqs` — FAQ management

### Super Admin Portal (role: super_admin)
- `/organizations` — CRUD all orgs, suspend, view usage
- `/system-config` — Global config values
- `/queue-monitor` — BullMQ job status, failed jobs, retry
- `/analytics/platform` — Cross-org platform metrics

---

## 10. Delivery Phases

### Phase 1 — Foundation (Week 1–2)
- Monorepo setup: `/backend`, `/frontend`, `/infrastructure`
- Docker Compose: MongoDB, Redis, BullMQ dashboard, mock Pinecone
- Full DB schema with all 24 collections and indexes applied
- Auth service: register, login, refresh, logout, OAuth2 (Google)
- `ui_config` generation on login based on role + org features
- Org middleware: all subsequent requests auto-scoped
- CI pipeline: lint → type-check → test → build on every PR

### Phase 2 — Core Backend (Week 3–5)
- User service with CRUD and RBAC enforcement
- Document service: upload, validation, virus scan, signed URL download
- Soft delete on all collections
- Audit logging middleware (fires async on every mutating operation)
- Notification service: in-app + email (SendGrid templates)
- API rate limiting per user and per org
- OpenAPI docs auto-generated from route decorators

### Phase 3 — RAG Pipeline (Week 6–8)
- BullMQ workers: text extraction, chunking, embedding, chorma upsert
- RAG status tracking per document
- Duplicate detection via content hash
- Chat service: session management, message persistence
- AI streaming endpoint (SSE): RAG query → Claude stream → client
- Fallback message when no relevant chunks found
- Token usage tracking per session
- Chat analytics updated async after each interaction

### Phase 4 — Ticket + Search (Week 9)
- Ticket service: CRUD, assignment, status workflow
- Ticket comments (internal + external)
- Chat-to-ticket escalation
- Global search (MongoDB Atlas full-text across org scope)
- SLA due date tracking

### Phase 5 — Frontend (Week 10–13)
- Bootstrap flow: login → ui_config → CSS vars → dynamic nav
- `<Can>` permission guard component
- Customer portal: chat with streaming, documents, tickets
- Admin portal: all management screens, analytics charts
- Support portal: ticket queue, document verification
- Responsive design (mobile-first), dark mode via CSS vars
