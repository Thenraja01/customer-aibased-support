# Frontend Design: Document Upload → Admin Approval → Role-Based RAG → Chunking Pipeline

## 1. Document Upload Flow (User/Frontline)

### Page: `/upload` (Accessible to: Support, Sales, HR, Finance roles)

```
┌─────────────────────────────────────────────────────────────┐
│  📄 Upload Document                              [Logout]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Drag & drop or click to upload                     │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │  📎  Drop PDF, DOCX, TXT, MD (max 50MB)    │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Document Metadata (Required)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐  │
│  │ Title *     │  │ Category *  │  │ Target Roles *     │  │
│  │ [__________]│  │ [Support ▼] │  │ ☐ Support  ☐ Sales │  │
│  └─────────────┘  └─────────────┘  │ ☐ HR       ☐ Finance│  │
│                                     │ ☐ Management       │  │
│                                     └────────────────────┘  │
│                                                             │
│  Tags (optional)                                            │
│  [refund, billing, onboarding, policy]                     │
│                                                             │
│  Chunking Preview (auto-generated preview)                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📄 Chunk 1 (512 tokens)  [Preview]  ✓ Valid        │   │
│  │ 📄 Chunk 2 (498 tokens)  [Preview]  ✓ Valid        │   │
│  │ 📄 Chunk 3 (512 tokens)  [Preview]  ⚠ Overlap      │   │
│  │        [Adjust chunk size: 512 ▼] [Overlap: 50 ▼]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Cancel]                    [Upload for Review →]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Component: `DocumentUpload.tsx`**
```tsx
// Key features:
// - Drag-drop with react-dropzone
// - Real-time chunking preview using tiktoken
// - Role multi-select with role descriptions
// - Client-side chunking preview (tiktoken-wasm)
// - Progress bar with chunking progress
```

---

## 2. Admin Document Approval Dashboard

### Page: `/admin/documents` (Role: Admin, Manager)

```
┌─────────────────────────────────────────────────────────────────────┐
│  📋 Document Approval Queue                              [Admin ▼] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Filters:  [All ▼] [Pending ▼] [Approved ▼] [Rejected ▼]  [Search] │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Document                    │ Uploader    │ Roles      │ Act │ │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ 📄 Refund Policy v3.pdf      │ Sarah (Sup) │ Support    │ ☐✓✗ │   │
│  │    12 pages • 2.3MB • 47 chunks                                    │
│  │    Tags: refund, policy, finance                                   │
│  │    Uploaded: 2h ago    [Preview] [Edit Roles] [✓ Approve] [✗]   │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ 📄 Onboarding Checklist.docx │ Mike (HR)   │ HR, Mgmt   │ ☐✓✗ │   │
│  │    8 pages • 1.1MB • 31 chunks                                       │
│  │    Tags: onboarding, hr, checklist                                 │
│  │    Uploaded: 5h ago    [Preview] [Edit Roles] [✓ Approve] [✗]   │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ 📄 Pricing Guide 2024.pdf    │ Lisa (Sales)│ Sales      │ ☐✓✗ │   │
│  │    24 pages • 4.2MB • 89 chunks                                      │
│  │    Tags: pricing, sales, 2024                                      │
│  │    Uploaded: 1 day ago [Preview] [Edit Roles] [✓ Approve] [✗]   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [Bulk Approve]  [Bulk Reject]  [Export CSV]                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Modal: Document Preview & Role Assignment

```
┌────────────────────────────────────────────────────────────┐
│  📄 Refund Policy v3.pdf                    [×]            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┬──────────────────────────────────┐  │
│  │  Document Preview │  Chunk Preview (47 chunks)       │  │
│  │  ┌──────────────┐ │ ┌────────────────────────────┐  │  │
│  │  │  [PDF Viewer] │ │ │ Chunk 1 (512 tok) ✓       │  │  │
│  │  │              │ │ │ "Refund requests within..." │  │  │
│  │  │  [Zoom] [Pg] │ │ │ [metadata: page 1, sec 1]  │  │  │
│  │  └──────────────┘ │ ├────────────────────────────┤  │  │
│  │                   │ │ Chunk 2 (498 tok) ✓       │  │  │
│  │  Chunk Settings:  │ │ "Full refund within 30..." │  │  │
│  │  [512 tokens ▼]  │ │ [metadata: page 1, sec 2]  │  │  │
│  │  [50 overlap ▼]  │ │ ═══════════════════════════ │  │  │
│  │  [Re-chunk]      │ │ Chunk 23 (512 tok) ⚠ OVER  │  │  │
│  │                   │ │ "Table spans pages..."      │  │  │
│  │  [Re-chunk Doc]   │ │ [⚠ Chunk spans page break] │  │  │
│  │                   │ └────────────────────────────┘  │  │
│  └──────────────────┴──────────────────────────────────┘  │
│                                                            │
│  Role Assignment:                                          │
│  ☑ Support    ☑ Finance    ☐ Sales    ☐ HR    ☑ Management│
│  ────────────────────────────────────────────────────────  │
│  [Reject with Note]          [Approve & Index → Vector DB] │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Component: `AdminDocumentQueue.tsx`**
```tsx
// Features:
// - Virtualized list (react-window) for 1000+ docs
// - PDF.js preview with chunk boundaries highlighted
// - Chunk quality indicators (✓ clean, ⚠ overlap, ✗ error)
// - Role assignment with multi-select + descriptions
// - Re-chunk button triggers re-chunking job
// - Bulk actions with confirmation modal
// - WebSocket updates for real-time queue updates
```

---

## 3. Role-Based Document Selection (Chatbot Interface)

### Page: `/chat` (Role-based document filtering)

```
┌─────────────────────────────────────────────────────────────────┐
│  💬 SupportAI Assistant                    [Sarah - Support ▼] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📚 Knowledge Sources (Active: 3 of 12 docs)           │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │  ☑ Refund Policy v3.pdf        [Support, Finance]│  │   │
│  │  │  ☑ Shipping Policy v2.pdf      [Support, Sales]  │  │   │
│  │  │  ☑ Technical Troubleshooting    [Support, Eng]   │  │   │
│  │  │  ☐ Onboarding Checklist         [HR, Management] │  │   │
│  │  │  ☐ Pricing Guide 2024            [Sales, Mgmt]   │  │   │
│  │  │  ☐ HR Policies 2024              [HR, Management]│  │   │
│  │  │  ☐ Financial Controls            [Finance, Mgmt] │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  │  [👁 Show all]  [🔍 Search docs...]  [⚙ Manage Access] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💬 Chat                                                    │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ 🤖 How can I help with refund requests today?       │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ 👤 What's the refund window for digital products?   │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │ 🤖 Based on **Refund Policy v3.pdf** (Support access):│  │   │
│  │  │                                                      │  │   │
│  │  │ Digital products: 14-day refund window from purchase │  │   │
│  │  │ date. Requires order confirmation and proof of       │  │   │
│  │  │ non-download. See Section 3.2 for exceptions.        │  │   │
│  │  │                                                      │  │   │
│  │  │ 📎 Sources: Refund Policy v3.pdf §3.2 (chunks 12-14) │  │   │
│  │  │      [👍] [👎]  [📄 View Source]                      │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  │                                                          │   │
│  │  [💬 Ask a follow-up...]                          [Send] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Component: `RoleBasedChat.tsx`**
```tsx
// Features:
// - Role badge in header (from auth context)
// - Document selector filtered by user's role (from JWT)
// - Source citations with chunk references
// - Thumbs up/down for RLHF feedback
// - "View Source" opens chunk preview modal
// - Role badge on each response showing which docs were accessible
// - "Manage Access" → redirects to /admin/documents (if admin)
```

---

## 4. Chunking Pipeline Visualization & Monitoring

### Page: `/admin/chunking` (Role: Admin, Data Engineer)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚙️ Chunking Pipeline Monitor                              [Admin] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Pipeline Status:  🟢 Healthy    Last Run: 2 min ago  [Refresh]   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Pipeline Stages                                              │   │
│  ├──────────────┬──────────────┬──────────────┬────────────────┤   │
│  │  1. Parse    │  2. Chunk    │  3. Embed    │  4. Index      │   │
│  │  ✅ 99.2%    │  ✅ 98.7%    │  ✅ 99.9%    │  ✅ 99.5%      │   │
│  │  2.1s avg    │  1.8s avg    │  3.2s avg    │  0.8s avg      │   │
│  └──────────────┴──────────────┴──────────────┴────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Chunk Quality Metrics (Last 24h)                            │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  Metric                  │ Value     │ Target    │ Status   │   │
│  ├──────────────────────────┼───────────┼───────────┼──────────┤   │
│  │ Avg chunk size           │ 512 tok   │ 512 tok   │ 🟢       │   │
│  │ Chunk size std dev       │ 23 tok    │ < 50 tok  │ 🟢       │   │
│  │ Overlap consistency      │ 98.2%     │ > 95%     │ 🟢       │   │
│  │ Boundary coherence       │ 94.1%     │ > 90%     │ 🟢       │   │
│  │ Empty chunk rate         │ 0.3%      │ < 1%      │ 🟢       │   │
│  │ Embedding failures       │ 0.1%      │ < 0.5%    │ 🟢       │   │
│  └──────────────────────────┴───────────┴───────────┴──────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Recent Documents & Chunk Quality                            │   │
│  ├─────────────────────┬────────┬────────┬────────┬────────────┤   │
│  │ Document            │ Chunks │ AvgTok │ Issues │ Action     │   │
│  ├─────────────────────┼────────┼────────┼────────┼────────────┤   │
│  │ Refund Policy v3.pdf │ 47     │ 512    │ 2      │ [Fix]      │   │
│  │ Pricing Guide 2024   │ 89     │ 508    │ 0      │ ✓          │   │
│  │ HR Policies 2024     │ 156    │ 515    │ 12 ⚠   │ [Re-chunk] │   │
│  │ Technical Guide v2   │ 203    │ 498    │ 1      │ [Fix]      │   │
│  └─────────────────────┴────────┴────────┴────────┴────────────┘   │
│                                                                     │
│  Chunking Configuration:                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Strategy: [Semantic ▼]  Chunk Size: [512 ▼]  Overlap: [50 ▼]│   │
│  │  Separators: ["\n\n", "\n", ". ", "! ", "? ", " "]         │   │
│  │  Min Chunk: [100]  Max Chunk: [800]                         │   │
│  │  [Save Config]  [Test on Sample]  [Re-index All]            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Chunk Quality Modal (Drill-down)

```
┌────────────────────────────────────────────────────────────┐
│  📄 HR Policies 2024 - Chunk Analysis (12 issues)    [×]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Chunk Strategy: Semantic (512 tokens, 50 overlap)        │
│  Parser: pdf-parse + mammoth (DOCX)                       │
│  Embedding: text-embedding-3-small                        │
│                                                            │
│  ⚠ Issues Found:                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ⚠ Chunk 23: Table split across boundary (42% cutoff) │  │
│  │    "Table 3: Leave Types" → split mid-row             │  │
│  │    [Fix: Merge with 24]  [Ignore]  [View Context]    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ⚠ Chunk 67: Header orphaned (3 tokens)               │  │
│  │    "## 4.3" alone at end of chunk                     │  │
│  │    [Fix: Merge with 66]  [Ignore]                    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ ✗ Chunk 112: Empty after parsing (0 tokens)         │  │
│  │    [Remove]  [Re-parse Page 12]                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Chunk Visualization:                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ████████████████████████████ 512  ████████████ 498    │  │
│  │ ████████████████████████████ 512  ██████████  32 ⚠   │  │
│  │ ████████████████████████████ 512  ████████████ 508    │  │
│  │ ████████████████████████████ 512  ████████████ 512    │  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │ Green=good  Yellow=small  Red=issue  Grey=empty       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  [Re-chunk Document]  [Export Issues]  [Close]            │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 5. Component Architecture

```
src/
├── features/
│   ├── document-upload/
│   │   ├── DocumentUpload.tsx           # Main upload component
│   │   ├── ChunkPreview.tsx             # Real-time chunk preview
│   │   ├── RoleSelector.tsx             # Multi-select with descriptions
│   │   ├── useChunkPreview.ts           # Hook for client-side chunking
│   │   └── types.ts
│   │
│   ├── admin-documents/
│   │   ├── AdminDocumentQueue.tsx       # Main queue table
│   │   ├── DocumentPreviewModal.tsx     # PDF preview + chunk view
│   │   ├── RoleAssignmentModal.tsx      # Role multi-select
│   │   ├── ChunkQualityIndicators.tsx   # Visual quality indicators
│   │   ├── useDocumentQueue.ts          # WebSocket + polling hook
│   │   └── types.ts
│   │
│   ├── role-based-chat/
│   │   ├── RoleBasedChat.tsx            # Main chat interface
│   │   ├── DocumentSelector.tsx         # Role-filtered doc list
│   │   ├── SourceCitation.tsx           # Citation with chunk refs
│   │   ├── FeedbackButtons.tsx          # Thumbs up/down
│   │   ├── useRoleBasedRetrieval.ts     # Hook for role-filtered RAG
│   │   └── types.ts
│   │
│   └── chunking-monitor/
│       ├── ChunkingDashboard.tsx        # Main dashboard
│       ├── PipelineStatus.tsx           # Pipeline health
│       ├── QualityMetrics.tsx           # Metrics table
│       ├── DocumentChunkTable.tsx       # Doc list with issues
│       ├── ChunkAnalysisModal.tsx       # Drill-down modal
│       ├── ChunkVisualization.tsx       # Visual chunk bars
│       ├── ChunkingConfig.tsx           # Config editor
│       └── useChunkingMetrics.ts        # Metrics hook
│
├── shared/
│   ├── components/
│   │   ├── PdfViewer.tsx                # PDF.js wrapper
│   │   ├── ChunkBoundaryOverlay.tsx     # Highlights chunk boundaries
│   │   ├── RoleBadge.tsx                # Role badge component
│   │   ├── QualityBadge.tsx             # Quality indicator
│   │   └── VirtualizedTable.tsx         # react-window wrapper
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                   # Auth context + roles
│   │   ├── useWebSocket.ts              # Real-time updates
│   │   └── useApi.ts                    # API client
│   │
│   └── utils/
│       ├── chunking.ts                  # Client-side chunking preview
│       ├── pdf.ts                       # PDF.js helpers
│       └── roles.ts                     # Role definitions & permissions
│
└── api/
    ├── documents.ts                     # Document CRUD
    ├── admin.ts                         # Admin endpoints
    ├── chunking.ts                      # Chunking pipeline
    └── chat.ts                          # Chat/RAG endpoints
```

---

## 6. API Contracts

### Document Upload
```typescript
POST /api/documents
// Request (multipart/form-data)
{
  file: File,
  title: string,
  category: DocumentCategory,
  targetRoles: Role[],           // Selected by uploader
  tags: string[],
  chunkingConfig?: ChunkingConfig // Optional override
}

// Response
{
  documentId: string,
  status: 'pending_review',
  chunkPreview: ChunkPreview[],
  estimatedChunks: number
}
```

### Admin Approval
```typescript
POST /api/admin/documents/:id/approve
{
  approvedRoles: Role[],         // Admin can modify uploader's selection
  chunkingConfig?: ChunkingConfig,
  notes?: string
}

POST /api/admin/documents/:id/reject
{
  reason: string
}

POST /api/admin/documents/:id/rechunk
{
  chunkingConfig: ChunkingConfig
}
```

### Role-Based Retrieval (Chat)
```typescript
POST /api/chat
{
  message: string,
  userRole: Role,           // From JWT
  selectedDocIds?: string[], // Optional override
  topK?: number,
  useHybridSearch?: boolean,
  useReranker?: boolean
}

// Response
{
  answer: string,
  sources: SourceCitation[],
  accessibleDocIds: string[], // Docs user's role can access
  feedbackId: string
}

interface SourceCitation {
  documentId: string,
  documentTitle: string,
  chunkIds: string[],
  chunkTexts: string[],
  pageNumbers: number[],
  sectionTitles: string[],
  roles: Role[]  // Roles that have access
}
```

### Chunking Pipeline
```typescript
POST /api/admin/chunking/reindex
{
  documentIds?: string[],
  chunkingConfig: ChunkingConfig,
  forceReembed: boolean
}

GET /api/admin/chunking/metrics?window=24h
{
  pipelineHealth: 'healthy' | 'degraded' | 'down',
  stages: StageMetrics[],
  qualityMetrics: QualityMetrics[],
  recentDocuments: DocumentChunkSummary[]
}

interface ChunkingConfig {
  strategy: 'fixed' | 'semantic' | 'recursive',
  chunkSize: number,
  chunkOverlap: number,
  separators: string[],
  minChunkSize: number,
  maxChunkSize: number
}
```

---

## 7. Role-Based Access Control (RBAC) Matrix

| Role | Upload | View Own | View All | Approve | Reject | Re-chunk | Chat Access |
|------|--------|----------|----------|---------|--------|----------|-------------|
| Support | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | Support, Finance |
| Sales | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | Sales, Support |
| HR | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | HR, Management |
| Finance | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | Finance, Management |
| Management | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | All |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | All |
| Data Engineer | ✗ | ✗ | ✓ | ✗ | ✗ | ✓ | All (read-only) |

---

## 8. Chunking Quality Checks (Automated)

```typescript
// Runs after each document chunking job
interface ChunkQualityCheck {
  check: 'boundary_coherence' | 'size_consistency' | 'overlap_consistency' | 'empty_chunks' | 'table_integrity' | 'header_orphans',
  severity: 'error' | 'warning' | 'info',
  chunkIds: string[],
  message: string,
  autoFixAvailable: boolean,
  autoFixAction?: 'merge_with_next' | 'merge_with_prev' | 'remove' | 'reparse_section'
}

// Boundary coherence: Check semantic similarity across chunk boundaries
// Size consistency: Std dev of chunk sizes < threshold
// Table integrity: Detect table rows split across chunks (pdf-parse table detection)
// Header orphans: Headers with < 50 tokens at chunk end
```

---

## 9. Frontend Tech Stack Recommendations

| Category | Library |
|----------|---------|
| Framework | React 18 + TypeScript + Vite |
| State | Zustand + TanStack Query |
| UI | shadcn/ui + Tailwind CSS |
| PDF | @react-pdf-viewer + pdfjs-dist |
| Tables | @tanstack/react-table + @tanstack/react-virtual |
| Charts | Recharts |
| Real-time | Socket.io-client |
| Chunking | tiktoken-wasm (client preview) |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 |

---

## 10. Implementation Priority

| Phase | Features | Est. Effort |
|-------|----------|-------------|
| 1 | Document upload + chunk preview + role selection | 3 days |
| 2 | Admin queue + PDF preview + approve/reject | 4 days |
| 3 | Role-based chat + document selector + citations | 4 days |
| 4 | Chunking dashboard + quality metrics + re-chunk | 3 days |
| 5 | RBAC enforcement + audit logs + feedback loop | 2 days |
| **Total** | | **~16 days** |