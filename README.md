# SupportAI — AI-Powered Customer Support Platform

An enterprise-grade, multi-tenant AI customer support platform. SupportAI combines traditional customer service workflows (tickets, live chat, SLAs) with autonomous AI systems including Hybrid RAG, Graph RAG, intent-driven agents, and automated ticket intelligence.

## Features

- **Multi-tenant, branch-scoped architecture** — tiered RBAC across SuperAdmin, Organization Admin, Branch Admin, Support Agent, and Customer
- **Real-time live chat** — WebSocket (Socket.io) messaging with presence and notifications
- **Omnichannel tickets & SLAs** — ticket templates, assignments, and SLA / incident management
- **AI Copilots & RAG** — Hybrid + Graph RAG with ChromaDB vector store and configurable LLM providers
- **LLM orchestration & failover** — provider agnostic (Ollama, Google Gemini, Groq, etc.) with circuit breaker and fallback handling
- **Knowledge base** — document ingestion (PDF, DOCX), embeddings, chunking, versions, approvals, and verification
- **Branding & widgets** — customer-facing widget, quick actions, guardrails, and public storefront support
- **Billing & analytics** — organization billing, usage analytics, and admin portal
- **Multi-channel notifications** — SMTP email, Firebase FCM push, and OAuth 2.0 auth (Google / Facebook)

## Tech Stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React 18, TypeScript, Vite, Redux Toolkit, TanStack Query, Socket.io-client, Tailwind CSS |
| Backend    | Node.js, Express 5, Mongoose 9, Socket.io, Zod                       |
| Database   | MongoDB 8, Redis 7, ChromaDB (vectors)                               |
| Storage    | Cloudinary (media), GridFS (files)                                  |
| AI / LLM   | Ollama, Google Gemini, Groq (configurable, with failover)           |
| Infra      | Docker Compose, Nginx reverse proxy, ngrok                            |

## Repository Structure

```
├── client/frontend/     # React + Vite + TypeScript frontend
├── server/              # Node.js / Express backend (Express 5, ES modules)
│   ├── modules/         # Feature modules (auth, ticket, chat, rag, ai, analytics, ...)
│   ├── models/          # Mongoose schemas
│   ├── services/        # Shared services (LLM, embeddings, graph, cloudinary, ...)
│   ├── middleware/      # Auth, tenant scoping, RBAC, rate limiting
│   └── public/uploads/  # Uploaded files
├── nginx/               # Reverse proxy configuration
├── docs/                # Architecture, API, deployment, security docs
└── docker-compose.yml   # Redis, Ollama, ChromaDB, MongoDB, Nginx, ngrok
```

## Prerequisites

- Node.js 18+ and npm
- Docker + Docker Compose (for infra services)
- Ollama (local LLM engine) with an embedding model pulled (e.g. `nomic-embed-text`)

## Getting Started

### 1. Start infrastructure

```bash
docker compose up -d redis ollama chromadb mongodb
```

### 2. Configure environment

Copy and fill in the environment templates:

```bash
cp server/.env.example server/.env
cp client/frontend/.env.example client/frontend/.env
```

Key settings in `server/.env`:

- `MONGODB_URI` — MongoDB connection string
- `OLLAMA_BASE_URL` / `LLM_MODEL` — local LLM engine (default `llama3.2:3b`)
- `GEMINI_API_KEY`, `GROQ_API_KEY` — optional cloud LLM providers
- `JWT_SECRET`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` — auth & bootstrap admin

### 3. Install dependencies and seed

```bash
cd server
npm install
npm run seed        # optional: create super admin + seed data

cd ../client/frontend
npm install
```

### 4. Run the backend and frontend

```bash
# terminal 1 — backend (http://localhost:3030)
cd server
npm run dev

# terminal 2 — frontend (http://localhost:5173)
cd client/frontend
npm run dev
```

### 5. (Optional) Reverse proxy + public tunnel

```bash
docker compose up -d nginx ngrok
```

Nginx exposes the app on port `80` and proxies to the Vite frontend (5173) and Express API (3030). ngrok tunnels `nginx:80` for external access (`NGROK_AUTHTOKEN` required).

## Available Scripts

Backend (`server/`):

```bash
npm run dev          # start with nodemon
npm start            # production start
npm run seed         # seed super admin / demo data
npm test             # run tests
```

Frontend (`client/frontend/`):

```bash
npm run dev          # Vite dev server
npm run build        # production build
npm run preview      # preview production build
npm run lint         # eslint
```

## Documentation

More documentation lives in `docs/`:

- [Architecture](docs/architecture.md) — system design, multi-tenancy, RBAC model
- [API](docs/api.md) — backend API reference
- [Deployment](docs/deployment.md) — deployment guide
- [Security](docs/security.md) — security model & hardening
- [Testing](docs/testing.md) — testing strategy
- [RAG / Graph RAG](docs/rag.md), [Graph RAG](docs/graph-rag.md) — AI/RAG internals

## License

ISC