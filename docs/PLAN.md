# Admin Dashboard - Document Management Implementation Plan

## Overview
Add document uploading, document type management, and document verification pages to the super admin dashboard. All backed by existing server routes.

---

## Existing Server Infrastructure (Already Complete)
- `POST /documents` — Upload document (Cloudinary)
- `GET /documents` — List all documents
- `GET /documents/status/:status` — Filter by status
- `PATCH /documents/:id/status` — Update status
- `DELETE /documents/:id` — Delete
- `POST /document-types` — Create type
- `GET /document-types` — List types
- `PUT /document-types/:id` — Update type
- `DELETE /document-types/:id` — Delete type
- `GET /document-verifications` — List all verifications
- `GET /document-verifications/status/:status` — Filter by status
- `PATCH /document-verifications/:id/approve` — Approve
- `PATCH /document-verifications/:id/reject` — Reject (with remarks)
- `DELETE /document-verifications/:id` — Delete

## Bug Fix
- `server/modules/document/document.route.js:10` — `handleUpload` must be `handleUpload(uploadToCloud)`

---

## Files to Create/Modify

### 1. Fix Server Bug
- `server/modules/document/document.route.js` — Fix upload middleware

### 2. Client API Layer
- `client/frontend/src/api/document.api.js` — Document CRUD API
- `client/frontend/src/api/documentType.api.js` — Document Type API
- `client/frontend/src/api/documentVerification.api.js` — Verification API
- `client/frontend/src/api/index.js` — Add exports

### 3. Client Types
- `client/frontend/src/types/index.ts` — Add IDocument, IDocumentType, IDocumentVerification interfaces

### 4. Client Redux Store
- `client/frontend/src/store/adminSlice.ts` — Add documents, documentTypes, verifications state + reducers

### 5. Client Hooks
- `client/frontend/src/hooks/useAdminDocuments.ts` — Documents state management hook
- `client/frontend/src/hooks/useAdminDocumentTypes.ts` — Document Types hook
- `client/frontend/src/hooks/useAdminDocumentVerifications.ts` — Verifications hook

### 6. Client Components
- `client/frontend/src/components/admin/DocumentTable.tsx` — Table listing all documents
- `client/frontend/src/components/admin/DocumentUploadForm.tsx` — File upload form (multipart/form-data)
- `client/frontend/src/components/admin/DocumentTypeTable.tsx` — Document types table
- `client/frontend/src/components/admin/DocumentTypeForm.tsx` — Create/edit document type form
- `client/frontend/src/components/admin/DocumentVerificationTable.tsx` — Verifications table with approve/reject

### 7. Client Pages
- `client/frontend/src/pages/Admin/DocumentsPage.tsx` — Document management page
- `client/frontend/src/pages/Admin/DocumentTypesPage.tsx` — Document type management page
- `client/frontend/src/pages/Admin/DocumentVerificationsPage.tsx` — Verification management page

### 8. Routing & Navigation
- `client/frontend/src/App.tsx` — Add 3 new admin routes
- `client/frontend/src/components/admin/AdminSidebar.tsx` — Add sidebar links

---

## Page Designs

### DocumentsPage
- Header with title + "Upload Document" button
- Status filter tabs (All / Pending / Approved / Rejected)
- Search input
- DocumentTable with columns: Title, Type, Uploaded By, Status, Date, Actions (View, Delete)
- Upload modal with file input, title, document type select
- Pagination

### DocumentTypesPage
- Header with title + "New Document Type" button
- DocumentTypeTable with columns: Name, Description, Actions (Edit, Delete)
- Create/Edit modal form

### DocumentVerificationsPage
- Header with title
- Status filter tabs (All / Pending / Approved / Rejected)
- DocumentVerificationTable with columns: Document, Verified By, Status, Remarks, Date, Actions (Approve/Reject)
- Reject modal with remarks textarea

---