# SupportAI - Project Overview

## Description
SupportAI is a customer support platform powered by AI-based document retrieval (RAG), real-time chat, and multi-tenant organization management.

## Tech Stack

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5
- **Database**: MongoDB (Mongoose 9)
- **Vector Store**: ChromaDB
- **LLM**: Ollama (llama3.2:3b) / Groq / Gemini
- **Embedding Model**: nomic-embed-text (768 dimensions)
- **Cache**: Redis (ioredis)
- **File Storage**: Cloudinary
- **Auth**: JWT (jsonwebtoken)

### Frontend
- **Framework**: React (Vite + TypeScript)
- **Styling**: TailwindCSS / custom components

## Architecture

```
Client (React/Vite)
    ↓ REST API / WebSocket
Server (Express)
    ├── Auth Middleware (JWT)
    ├── Chat Module (AI Chat, FAQ, Guardrails)
    ├── RAG Module (Hybrid Search: Vector + Keyword + Graph)
    ├── Document Module (Upload, Version, Approval, Publish)
    ├── Organization / Branch / User Management
    └── External Services
        ├── MongoDB (data)
        ├── ChromaDB (vector index)
        ├── Redis (cache, rate limiting)
        ├── Ollama (LLM + embeddings)
        └── Cloudinary (file storage)
```

## Document Lifecycle

```
uploaded → processing → ready_for_review → pending_approval → approved → published → archived
```

Only **published** documents enter the RAG retrieval pipeline.

## RBAC Model

| Level | Role          | Description                                      |
|-------|---------------|--------------------------------------------------|
| 0     | super_admin   | Platform owner. Manages organizations and admins. |
| 1     | admin         | Organization administrator.                      |
| 2     | branch_admin  | Manages a single branch.                         |
| 3     | support       | Assists customers within a branch.               |
| 4     | customer      | End user with self-service access.               |

Authorization is enforced via `document.allowed_roles` and `chunk.allowedRoles`.

## Key Modules

| Module               | Path                                  | Purpose                                  |
|----------------------|---------------------------------------|------------------------------------------|
| RAG Service          | `server/modules/rag/rag.service.js`   | Vector, keyword, graph search + ingestion |
| AI Chat Service      | `server/modules/chat/aiChat.service.js` | Chat processing, confidence, prompt building |
| Document Service     | `server/modules/document/document.service.js` | Upload, approve, publish documents |
| Document Approval    | `server/modules/document-approval/`   | Approval workflow                        |
| Knowledge Graph      | `server/modules/chat/knowledgeGraph.service.js` | Graph entity search             |
| Confidence Service   | `server/modules/chat/confidence.service.js` | Reranking and confidence scoring    |

## Running Locally

```bash
# Start infrastructure
docker-compose up -d

# Start ChromaDB (if not in docker-compose)
docker run -d -p 8000:8000 --name chromadb chromadb/chroma

# Install and seed
cd server && npm install && node seed.js

# Start dev server
npm run dev
```

## Environment
See `server/.env.example` for all required environment variables.
