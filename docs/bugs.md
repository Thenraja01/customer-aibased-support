# SupportAI - Known Bugs & Fixes

## Fixed Bugs

### BUG-001: Chatbot cannot find shipping information for customers
- **Date Fixed**: 2026-08-11
- **Severity**: Critical
- **Symptom**: Customer asks "What are your shipment times?" and chatbot responds that it cannot find the information, even though the FAQ chunk exists in MongoDB with content, embedding, and keywords.
- **Root Causes** (multiple filters rejecting the chunk):
  1. **Status mismatch**: RAG searched for `"approved"` but the intended lifecycle requires documents to be `"published"` before entering RAG. The chunk had `status: "approved"` but never transitioned to `"published"`.
  2. **Missing `documentVersionId`**: The chunk had `documentVersionId: null` because no `DocumentVersion` was created during the original upload flow.
  3. **RBAC misconfiguration**: `document.allowed_roles` was `["branch_admin", "support"]` — missing `"customer"`. The old code also filtered on legacy `assigned_role` and `customerVisible: false` instead of the explicit `allowedRoles` array.
  4. **Chroma metadata**: Chroma metadata used `assigned_role` for filtering. Chroma does not support array-type metadata values, so role filtering was unreliable.
  5. **Branch scope**: `branch_id: null` was not correctly interpreted as "organization-wide" in vector search filters.
- **Fix**:
  - Changed RAG pipeline to search only `"published"` documents.
  - Updated RBAC to use `allowedRoles` (MongoDB) and boolean `role_<name>` flags (Chroma).
  - Created migration script to backfill `DocumentVersion`, set `allowed_roles` to include `"customer"`, transition to `"published"`, and re-index Chroma.
  - Fixed branch scope filter to treat `branch_id = null` as organization-wide.
- **Files Modified**:
  - `server/modules/rag/rag.service.js`
  - `server/modules/chat/confidence.service.js`
  - `server/modules/chat/aiChat.service.js`
  - `server/modules/document-version/documentVersion.schema.js`
- **Migration Script**: `server/scripts/migrate_and_backfill.js`

---

### BUG-002: FAQ matches with low scores bypassing RAG
- **Date Fixed**: Prior to BUG-001
- **Severity**: Medium
- **Symptom**: Low-confidence FAQ matches (score < 0.6) were triggering FAQ responses and skipping the RAG pipeline entirely, causing false positives.
- **Fix**: Raised FAQ match threshold from 0.3 to `FAQ_MIN_SCORE` (default 0.6) in `aiChat.service.js`.

---

### BUG-003: Keyword search `document_id` silent overwrite
- **Date Fixed**: Prior to BUG-001
- **Severity**: Medium
- **Symptom**: When both `documentId` and `authorizedDocIds` were provided, the second assignment to `query.document_id` silently overwrote the first, dropping one filter.
- **Fix**: Merged both into a single `$in` array before assigning to `query.document_id`.

---

## Open Issues

### ISSUE-001: ChromaDB not in docker-compose
- **Severity**: Low
- **Description**: ChromaDB is not included in `docker-compose.yml`. Developers must start it manually with `docker run`. Consider adding it to the compose file.

### ISSUE-002: DocumentVersion `branch_id` was required
- **Severity**: Medium (fixed)
- **Description**: `DocumentVersion.schema.js` had `branch_id: { required: true }` which prevented creating versions for organization-wide documents (`branch_id: null`). Fixed by making it optional with `default: null`.

### ISSUE-003: Graph entity seeding only runs on published documents
- **Severity**: Low
- **Description**: `seedGraphEntities()` only seeds from published documents. If no documents are published at startup, no graph entities are created. Consider triggering graph seeding during the publish workflow.
