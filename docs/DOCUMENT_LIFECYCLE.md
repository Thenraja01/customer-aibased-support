# Document Lifecycle & the Four-Eye Rule

Reference for how documents move through the system, who is allowed to approve them, and what "published" vs "archived" means for RAG availability.

---

## 1. The Four-Eye Rule

The four-eye rule (a.k.a. two-person rule / separation of duties) guarantees that **the person who uploads a document is never the person who approves it**. No single user can move their own document through the approval gate and straight into the knowledge base.

- **Uploader** — anyone with `document.upload` / `document.edit` (typically customers and support staff).
- **Approver** — a different user holding `document.approve` (typically an org admin).

The rule is enforced at the approval boundary: `POST/PATCH /documents/:id/approve` (and the equivalent admin verification approve path) rejects the action when the requesting user is the document's `user_id`. The uploader is recorded on the document (`user_id`), and the approver is recorded separately (`approved_by` / `approved_at`), so the audit trail always shows two distinct actors.

### Why it matters

- Prevents a contributor from sneaking unvetted content into the RAG knowledge base.
- Keeps the approval audit log meaningful (an "approved by X" entry implies an independent reviewer).
- Satisfies common compliance requirements for knowledge/document controls.

### Exceptions

- **Admin uploads are auto-approved.** An org admin who uploads a document directly (with `document.approve`) is considered the publisher of that content — no second approval is required. The upload is recorded with `approved_by = <same admin>` and `approved_at` set immediately. This is the deliberate "admin is the publisher" path.

---

## 2. Statuses

Defined in `server/utils/constants.js`:

```
DOCUMENT_STATUSES = ["draft", "pending", "approved", "rejected", "published", "archived"]
```

| Status | Meaning | In RAG? |
|---|---|---|
| `draft` | Uploaded, not submitted for review (uploader's working copy). | No |
| `pending` | Submitted for admin review. | No |
| `approved` | Independently reviewed and approved (four-eye gate passed). Ready to publish. | Yes* |
| `rejected` | Review found issues; uploader may edit and resubmit. | No |
| `published` | Approved and explicitly made available to the chatbot / knowledge base. | Yes |
| `archived` | Retired from the knowledge base; kept for the audit trail, no longer served. | No |

\* `approved` documents are indexed into RAG immediately at approval time so they can be published without re-ingestion. Publishing flips the visible status; archiving removes it from retrieval.

---

## 3. Transition Map

`DOCUMENT_TRANSITIONS` (also in `constants.js`):

```
draft    → pending, archived
pending  → approved, rejected, draft
approved → published, rejected, archived
published→ archived
rejected → pending
archived → draft          (restore)
```

In prose:

- **draft** → submit for review (`pending`), or discard (`archived`).
- **pending** → approve (four-eye), reject, or withdraw back to draft.
- **approved** → publish, reject, or archive.
- **published** → archive only.
- **rejected** → resubmit as pending (after edits).
- **archived** → restore to draft (a new review cycle).

Illegal transitions (e.g. `draft → published`, `archived → published`, `pending → published`) are rejected with a 400.

---

## 4. Chunk / RAG Synchronization

Document status changes are propagated to the chunk layer (`DocumentChunk`) and the vector index:

| Document status change | Chunk behavior |
|---|---|
| → `approved` / `published` | Chunks marked `approved` and indexed into RAG. |
| → anything non-approved (`rejected`, `archived`, back to `draft`) | Chunks deleted from the vector index so the content is no longer retrievable. |
| `assigned_role` change | Propagated to chunk `assigned_role` so role-based filtering stays in sync. |

This keeps the knowledge base exactly aligned with the lifecycle — nothing "published" is ever silently un-indexed, and nothing archived stays queryable.

---

## 5. Example Walkthrough

**Customer uploads a document**

```
Customer uploads                     → status = draft (user_id = customer)
Customer submits for review          → status = pending
Admin (different user) approves      → status = approved, approved_by = admin
                                        chunks indexed into RAG
Admin publishes                      → status = published
                                       (served to the chatbot)
Admin archives                       → status = archived
                                       chunks purged, no longer retrievable
```

**Support uploads a document**

Same flow as a customer: support uploads → draft → pending → independent admin approval → publish.

**Admin uploads a document directly**

```
Admin uploads (has document.approve) → status = approved (auto), approved_by = admin
Admin publishes                      → status = published
```

The four-eye rule does not apply because the admin is acting as publisher, not contributor.

---

## 6. Key Files

| File | Role |
|---|---|
| `server/utils/constants.js` | `DOCUMENT_STATUSES`, `DOCUMENT_TRANSITIONS` |
| `server/modules/document/document.schema.js` | `status`, `approved_by`, `approved_at`, `user_id` |
| `server/modules/document/document.service.js` | `createDocument`, `approveDocument`, `updateDocumentStatus`, `deleteDocument` |
| `server/modules/document/documentChunk.schema.js` | chunk `status` / `assigned_role` mirror |
| `server/modules/document-verification/documentVerification.schema.js` | the verification/approval record (`verified_by`, `remarks`) |
| `server/validation/document.validation.js` | status input validation |
