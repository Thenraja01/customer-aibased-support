# SupportAI - Implementation Details

## Hybrid RAG Retrieval Pipeline

The retrieval pipeline combines three search strategies to maximize recall and precision:

### 1. Vector Search (50% weight)
- **Engine**: ChromaDB (local, port 8000)
- **Model**: `nomic-embed-text` (768 dimensions)
- **Pre-retrieval Filters** (applied in Chroma `where` clause):
  - `organization_id` must match authenticated user
  - `branch_id` must match user's branch (or `""` for org-wide documents)
  - `role_<user_role>: true` (boolean metadata flag)
  - `status: "published"`
- **Post-retrieval**: Cosine similarity scores normalized to 0–1

### 2. Keyword Search (30% weight)
- **Engine**: MongoDB text index on `DocumentChunk.content` and `DocumentChunk.keywords`
- **Filters**:
  - `organization_id` matches user
  - `allowedRoles` includes user's role (via `$in`)
  - `status: "published"`
  - `document_id` restricted to `authorizedDocumentIds` when available
- **Scoring**: MongoDB `$meta: "textScore"` normalized to 0–1

### 3. Graph Search (20% weight)
- **Engine**: MongoDB `GraphEntity` collection
- **Process**:
  1. Extract query keywords and expand with synonyms (e.g., "shipment" → "shipping", "delivery")
  2. Find `GraphEntity` documents matching keywords by `entity_name` regex
  3. Filter by `organization_id` and `branch_id`
  4. Join matching documents against authorized document IDs
  5. Fetch corresponding chunks and verify `allowedRoles` and `status`
  6. Score based on entity match count relative to total keywords

### Reranking
Results from all three sources are merged by chunk `_id` in `confidence.service.js::rerankResults()`:
- Scores are weighted: vector × 0.5 + keyword × 0.3 + graph × 0.2
- Top N results are selected (default: 5)
- Normalized to 0–1 range for confidence calculation

---

## RBAC Authorization

### Access Verification Flow (`rag.service.js::verifyAccess`)
```
1. Normalize role name (e.g., "Branch Admin" → "branch_admin")
2. Build role filter: { $in: [roleName, "all", "public"] }
3. Query MongoDB for documents where:
   - organization_id matches user
   - allowed_roles matches role filter
   - status is "published"
   - branch_id is null (org-wide) or matches user's branch
4. Return authorized document IDs list
```

### Chroma Boolean Role Flags
Since ChromaDB metadata only supports primitive values (no arrays), RBAC is enforced via boolean flags:
```json
{
  "role_super_admin": true,
  "role_admin": true,
  "role_branch_admin": true,
  "role_support": true,
  "role_customer": true
}
```
At query time, the filter `{ role_customer: true }` is applied.

---

## Document Lifecycle

```
uploaded → processing → ready_for_review → pending_approval → approved → published → archived
```

| Status             | In RAG? | Description                                   |
|--------------------|---------|-----------------------------------------------|
| uploaded           | No      | File uploaded, not yet processed               |
| processing         | No      | Text extraction, chunking, embedding in progress |
| ready_for_review   | No      | Processing complete, awaiting reviewer         |
| pending_approval   | No      | Submitted for approval                        |
| approved           | No      | Approved but not yet published                |
| **published**      | **Yes** | Active in RAG pipeline                        |
| archived           | No      | Retired from active use                       |

### Version-Aware Chunks
Every `DocumentChunk` must have a `documentVersionId` pointing to a valid `DocumentVersion`. Chunks without a version are excluded from retrieval.

---

## Debug Trace Logging

The `traceRetrievalDebug()` function logs 12 metrics for every search request:

| #  | Metric                           | Purpose                                      |
|----|----------------------------------|----------------------------------------------|
| 1  | Authenticated User Role          | The normalized role used for RBAC            |
| 2  | Authenticated Organization ID    | Org scope                                    |
| 3  | Authenticated Branch ID          | Branch scope (null = org-wide)               |
| 4  | Documents matching organization  | Org filter pass count                        |
| 5  | Documents matching branch scope  | Branch filter pass count                     |
| 6  | Documents matching RBAC          | Role filter pass count                       |
| 7  | Documents matching published     | Status filter pass count                     |
| 8  | Documents matching current version | Version filter pass count                  |
| 9  | Vector search candidate count    | Chunks from ChromaDB                         |
| 10 | Keyword search candidate count   | Chunks from MongoDB text search              |
| 11 | Graph search candidate count     | Chunks from GraphEntity join                 |
| 12 | Final candidate count            | Deduplicated merged results                  |

When candidates are rejected, the trace identifies which filter caused the rejection (organization, branch, RBAC, status, or version).

---

## Migration & Backfill

Script: `server/scripts/migrate_and_backfill.js`

### What it does:
1. Finds the target document and creates a `DocumentVersion` if missing
2. Sets `allowed_roles` to include `"customer"` and status to `"published"`
3. Updates all associated chunks with the version ID, status, and roles
4. Seeds `GraphEntity` concept nodes for shipping/delivery terms
5. Re-indexes all published chunks into ChromaDB with boolean role metadata

### When to run:
- After uploading legacy documents that were never versioned
- After changing RBAC roles on existing documents
- After schema migrations that affect chunk metadata

---

## Confidence Scoring

The confidence service (`confidence.service.js`) evaluates retrieval quality:

| Score Range | Level   | Action                                    |
|-------------|---------|-------------------------------------------|
| ≥ 0.75      | High    | Respond directly from RAG context          |
| 0.50 – 0.74 | Medium  | Respond with disclaimer, offer human agent |
| < 0.50      | Low     | Escalate to human agent                    |

Confidence is calculated from:
- Best RAG score (highest individual chunk score)
- Average RAG score (mean across top results)
- FAQ match score (if FAQ matched)
- Match count (number of relevant chunks found)
