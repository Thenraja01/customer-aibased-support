# Deployment & Infrastructure Guide

This guide covers local container setup, environment variable configuration, Docker Compose orchestration, and production deployment for SupportAI.

---

## 1. System Requirements & Architecture Stack

- **Node.js:** v18+ (Node 20 LTS recommended)
- **MongoDB:** v6.0+ (Document Database)
- **Redis:** v7.0+ (Caching, Rate Limiting, Pub/Sub)
- **ChromaDB:** v0.4+ (Vector Store on port 8000)
- **Neo4j:** v5.0+ (Graph Database on port 7687 / 7474)
- **Cloudinary:** Media asset storage and document attachments
- **Firebase Admin:** FCM Push Notifications

---

## 2. Docker Compose Setup

Run the core data and vector infrastructure using the root `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: supportai_mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    container_name: supportai_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  chromadb:
    image: chromadb/chroma:latest
    container_name: supportai_chroma
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma

  neo4j:
    image: neo4j:5-community
    container_name: supportai_neo4j
    restart: unless-stopped
    ports:
      - "7474:7474" # HTTP Browser
      - "7687:7687" # Bolt Protocol
    environment:
      - NEO4J_AUTH=neo4j/supportai_secret_password
    volumes:
      - neo4j_data:/data

volumes:
  mongo_data:
  redis_data:
  chroma_data:
  neo4j_data:
```

### Start Containers
```bash
docker compose up -d
```

---

## 3. Environment Variables

### Backend `.env` (`server/.env`)
```ini
# Server Config
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connections
MONGO_URI=mongodb://localhost:27017/supportai
REDIS_URL=redis://localhost:6379
CHROMADB_URL=http://localhost:8000
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=supportai_secret_password

# Authentication & JWT
JWT_SECRET=super_secret_jwt_key_here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=super_secret_refresh_key_here

# AI & LLM Providers
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
ANTHROPIC_API_KEY=your_claude_api_key
OLLAMA_BASE_URL=http://localhost:11434

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Notifications & SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@yourcompany.com
SMTP_PASS=your_app_password
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

---

## 4. Step-by-Step Local Running Guide

### Step 1: Initialize Database & Seed Roles
```bash
cd server
npm install
npm run seed      # Seeds SuperAdmin, default Org, roles, and KB topics
```

### Step 2: Start Express Backend Server
```bash
npm run dev       # Starts server on http://localhost:5000 with nodemon
```

### Step 3: Start React TypeScript Frontend
```bash
cd ../client/frontend
npm install
npm run dev       # Starts Vite dev server on http://localhost:5173
```

### Step 4: Build Verification
```bash
cd client/frontend
npm run build     # Validates TypeScript compilation and bundles static assets
```
