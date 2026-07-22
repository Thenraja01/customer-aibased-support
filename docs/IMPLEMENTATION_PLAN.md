# Frontend Implementation Plan

## Project Setup (Vite + React + TypeScript + Tailwind + shadcn/ui)

## Phase 1: Core Infrastructure (Day 1)
1. Initialize Vite + React + TypeScript + Tailwind
2. Install shadcn/ui components
3. Set up TanStack Query + Zustand + React Router
4. Configure API client (Axios + interceptors)
5. Set up authentication context (JWT + roles)

## Phase 2: Document Upload Feature (Day 2-3)
1. `DocumentUpload` component with drag-drop
2. Client-side chunking preview (tiktoken-wasm)
3. Role selector with descriptions
4. Upload API integration

## Phase 3: Admin Document Queue (Day 4-5)
1. Virtualized document table (TanStack Table + Virtual)
2. PDF preview modal with chunk boundaries
3. Role assignment modal
4. Approve/Reject/Re-chunk actions
5. WebSocket for real-time updates

## Phase 4: Role-Based Chat (Day 6-7)
1. Role-based document selector
2. Chat interface with citations
3. RAG API integration with role filtering
4. Feedback collection (thumbs up/down)

## Phase 5: Chunking Monitor (Day 8-9)
1. Pipeline health dashboard
2. Quality metrics table
3. Document chunk quality table
4. Drill-down modal with visual chunks
5. Re-chunk configuration

## Phase 6: Polish & Integration (Day 10)
1. RBAC enforcement on routes/components
2. Error boundaries & loading states
3. Toast notifications
4. E2E testing

---

Let me start implementing.