# AI Project Architecture Report

## Executive Summary

This is a multi-tenant AI-powered customer support system with comprehensive features including chatbot functionality, ticket management, document processing, and real-time messaging. The system uses a React frontend with Redux state management, Express.js backend with MongoDB, and integrates with multiple AI providers (Ollama, Gemini, Groq) for intelligent responses.

## Project Structure

### Root Level
```
customer-aibased-support/
├── client/                    # Frontend application
│   └── frontend/            # React + TypeScript + Vite
├── server/                   # Backend application  
│   └──                      # Node.js + Express + MongoDB
├── docs/                    # Documentation
├── uploads/                 # File upload storage
└── docker-compose.yml       # Container orchestration
```

### Frontend Architecture (`client/frontend/`)

**Technology Stack:**
- React 19.0.0 with TypeScript
- Vite 6.0.0 for build tooling
- Redux Toolkit for state management
- React Router DOM 7.18.1 for routing
- Socket.io Client 4.8.3 for real-time communication
- Tailwind CSS 3.4.19 for styling
- Firebase 12.16.0 for authentication and messaging
- Framer Motion 11.18.2 for animations
- Recharts 2.15.4 for data visualization

**Directory Structure:**
```
src/
├── api/                      # API layer and HTTP clients
├── assets/                   # Static assets
├── components/               # Reusable components
│   ├── 3d/                  # 3D visualization components
│   ├── admin/               # Admin-specific components
│   ├── chat/                # Chat interface components
│   ├── ticket/              # Ticket management components
│   └── ui/                  # UI primitives (shadcn)
├── config/                   # Configuration files
├── context/                  # React contexts (Auth, Theme, Socket, etc.)
├── hooks/                    # Custom React hooks
├── layout/                   # Layout components by role
├── lib/                      # Utility libraries
├── pages/                    # Page components by role
│   ├── Admin/               # Admin pages
│   ├── AuthPage/            # Authentication pages
│   ├── Customer/            # Customer pages
│   ├── Marketing/           # Public marketing pages
│   ├── SuperAdmin/          # Super admin pages
│   └── Support/             # Support agent pages
├── routes/                   # Route definitions
├── store/                    # Redux store and slices
├── types/                    # TypeScript type definitions
└── utils/                    # Utility functions
```

**Key Frontend Modules:**
- **Authentication:** Login, Register, OAuth (Google, Facebook), OTP verification
- **Role-Based UI:** Separate layouts and routes for Customer, Admin, SuperAdmin, Support
- **Chat Interface:** Real-time AI chatbot with typing indicators and message history
- **Ticket System:** Ticket creation, management, and AI-assisted responses
- **Document Management:** Upload, view, and verify documents
- **Admin Dashboard:** Analytics, user management, organization management
- **Notifications:** Real-time notifications via Firebase and Socket.io

### Backend Architecture (`server/`)

**Technology Stack:**
- Node.js with Express 5.2.1
- MongoDB 7.5.0 with Mongoose 9.7.4
- Socket.io 4.8.3 for real-time communication
- JWT for authentication
- Firebase Admin 14.2.0 for push notifications
- Cloudinary 2.10.0 for file storage
- Multiple AI providers:
  - Google Generative AI 0.24.1
  - Groq SDK 1.3.0
  - Ollama (for local LLM)
- Zod 4.4.3 for validation
- Bcrypt 6.0.0 for password hashing

**Directory Structure:**
```
server/
├── config/                   # Configuration files
│   ├── env.js               # Environment configuration
│   ├── firebase.js          # Firebase setup
│   └── redis.js             # Redis configuration
├── middleware/              # Express middleware
│   ├── auth.middleware.js   # JWT authentication
│   └── authorize.middleware.js # RBAC authorization
├── modules/                 # Feature modules
│   ├── admin/               # Admin operations
│   ├── ai/                  # AI analytics and feedback
│   ├── ai-session/          # AI session management
│   ├── audit-log/           # Audit logging
│   ├── auth/                # Authentication & OAuth
│   ├── chat/                # Chat operations
│   ├── communication/       # Communication management
│   ├── document/            # Document processing
│   ├── document-type/       # Document type management
│   ├── document-verification/ # Document verification
│   ├── faq/                 # FAQ management
│   ├── feedback/            # User feedback
│   ├── global-setting/      # Global settings
│   ├── knowledge-gap/       # Knowledge gap analysis
│   ├── llm/                 # LLM provider abstraction
│   ├── memory/              # Conversation memory
│   ├── message/             # Message handling
│   ├── notification/        # Notification system
│   ├── organization/        # Organization management
│   ├── permission/          # Permission management
│   ├── prompt-version/      # Prompt versioning
│   ├── rag/                 # RAG (Retrieval Augmented Generation)
│   ├── refresh-session/     # Session refresh
│   ├── registration-request/ # Registration requests
│   ├── role/                # Role management
│   ├── search/              # Search functionality
│   ├── super-admin/         # Super admin operations
│   ├── ticket/              # Ticket management
│   ├── user/                # User management
│   └── user-role/           # User-role relationships
├── scripts/                 # Utility scripts
├── services/                # Shared services
│   ├── embedding.service.js # Text embedding generation
│   └── gridfs.service.js    # GridFS file storage
├── utils/                   # Utility functions
├── validation/              # Request validation schemas
├── seed.js                  # Database seeding
└── server.js                # Application entry point
```

**Key Backend Modules:**
- **Authentication System:** JWT-based auth with OAuth integration (Google, Facebook)
- **Multi-Tenancy:** Organization-based isolation with tenant middleware
- **RBAC System:** Role-based access control with granular permissions
- **AI Integration:** Multi-provider LLM support with fallback mechanism
- **RAG Pipeline:** Document chunking, embedding generation, and semantic search
- **Chat System:** Real-time messaging with conversation memory
- **Ticket System:** Ticket lifecycle management with AI assistance
- **Document Processing:** Upload, verification, and knowledge extraction
- **Notification System:** Multi-channel notifications (email, Firebase, Socket)
- **Audit Logging:** Comprehensive audit trail for all operations

### AI Architecture

**AI Components:**
1. **LLM Provider Abstraction** (`server/modules/llm/`)
   - Base provider interface
   - Gemini provider implementation
   - Groq provider implementation
   - Fallback provider for redundancy

2. **RAG Pipeline** (`server/modules/rag/`)
   - Document chunking and storage
   - Embedding generation using local models
   - Vector similarity search
   - Context building and retrieval

3. **Prompt Management** (`server/modules/llm/prompt.js`)
   - Template-based prompt generation
   - Context injection
   - System prompt management

4. **AI Session Management** (`server/modules/ai-session/`)
   - Conversation tracking
   - Session persistence
   - Usage analytics

**AI Features:**
- Intelligent chatbot responses
- FAQ retrieval and matching
- Document-based knowledge retrieval
- Ticket response suggestions
- Conversation summarization
- Knowledge gap analysis

### Database Architecture

**MongoDB Collections:**
- **users:** User accounts with authentication credentials
- **organizations:** Multi-tenant organization data
- **roles:** Role definitions and permissions
- **user_roles:** User-role assignments
- **tickets:** Support tickets and metadata
- **messages:** Chat messages and ticket replies
- **documents:** Uploaded documents and metadata
- **document_chunks:** Processed document chunks for RAG
- **faqs:** Frequently asked questions
- **notifications:** Notification history
- **audit_logs:** System audit trail
- **ai_sessions:** AI conversation sessions
- **ai_feedback:** AI response feedback
- **communication:** System communications
- **feedback:** User feedback collection

**Key Schema Features:**
- Tenant isolation via organization references
- Soft delete patterns
- Timestamp tracking
- User attribution
- Validation schemas

### Integration Points

**External Services:**
- **MongoDB:** Primary data storage
- **Firebase:** Authentication and push notifications
- **Cloudinary:** File storage and CDN
- **Ollama:** Local LLM inference
- **Google Generative AI:** Cloud LLM provider
- **Groq:** Alternative cloud LLM provider
- **Redis:** Caching and session management (configured)

**Internal Communication:**
- **REST API:** Standard HTTP endpoints
- **WebSocket:** Real-time bidirectional communication via Socket.io
- **Event-driven:** Internal event system for notifications

### Security Architecture

**Authentication:**
- JWT token-based authentication
- OAuth 2.0 integration (Google, Facebook)
- OTP-based verification
- Password hashing with bcrypt
- Session refresh mechanism

**Authorization:**
- Role-based access control (RBAC)
- Permission-based endpoint protection
- Tenant isolation middleware
- API route guards

**Data Protection:**
- Input validation with Zod
- SQL injection prevention (NoSQL equivalent)
- XSS protection via sanitization
- CORS configuration
- Helmet.js security headers
- Rate limiting

### Performance Architecture

**Frontend Optimization:**
- Code splitting via React Router
- Lazy loading of components
- Redux memoization
- Debounced API calls
- Optimistic UI updates

**Backend Optimization:**
- Database indexing on frequently queried fields
- Connection pooling
- Caching layer (Redis)
- Async/await for non-blocking operations
- Efficient query patterns

**AI Optimization:**
- Embedding caching
- Prompt compression
- Response streaming (where supported)
- Fallback mechanisms for availability

## Technology Choices Rationale

### Frontend Choices
- **React 19:** Latest features and performance improvements
- **TypeScript:** Type safety and better developer experience
- **Vite:** Fast development server and optimized builds
- **Redux Toolkit:** Simplified Redux with built-in best practices
- **Tailwind CSS:** Utility-first CSS for rapid development
- **Socket.io Client:** Reliable real-time communication

### Backend Choices
- **Express.js:** Mature, flexible Node.js framework
- **MongoDB:** Flexible schema for evolving requirements
- **Mongoose:** Schema validation and convenient API
- **JWT:** Stateless authentication standard
- **Socket.io:** Real-time bidirectional communication

### AI Choices
- **Multi-provider approach:** Redundancy and cost optimization
- **Ollama:** Privacy-focused local inference
- **Gemini & Groq:** Advanced capabilities for complex queries
- **RAG:** Context-aware responses from domain knowledge

## Deployment Architecture

**Development:**
- Frontend: Vite dev server on port 5173
- Backend: Express server on port 5000
- MongoDB: Local instance or container

**Production (via Docker Compose):**
- Containerized frontend and backend
- MongoDB container
- Redis container
- Nginx reverse proxy (implied)
- Shared volume for uploads

## Known Issues and Technical Debt

### Frontend Issues
1. TypeScript compilation errors in new OAuth and password reset features
2. Missing API methods in auth.api.d.ts (getOAuthProviders, forgotPassword, resetPassword, etc.)
3. Navigation slice not properly integrated in Redux store
4. Some components have duplicate implementations (e.g., ProtectedRoute vs ProdectedRoute)

### Backend Issues
1. No build script defined (using Node.js directly)
2. Some new modules not fully integrated (ai, communication, feedback, permission)
3. Migration scripts present suggest ongoing schema changes
4. Seed script indicates manual data setup requirements

### Integration Issues
1. Stashed changes suggest ongoing development conflicts
2. Environment configuration requires manual setup
3. Local LLM and embedding model verification needed

## Scalability Considerations

**Current Limitations:**
- Single MongoDB instance (no sharding)
- No CDN for static assets (except Cloudinary)
- No horizontal scaling for backend
- Limited caching strategy

**Future Improvements:**
- Database sharding for multi-tenant scaling
- Load balancing for backend instances
- Distributed caching
- CDN for frontend assets
- Microservices architecture for specific modules

## Monitoring and Observability

**Current Implementation:**
- Audit logging module
- AI usage tracking
- Error handling middleware
- Basic logging

**Recommended Additions:**
- Application performance monitoring (APM)
- Distributed tracing
- Centralized logging
- Metrics collection and alerting
- Health check endpoints

## Conclusion

This is a well-architected multi-tenant AI support system with solid foundations. The modular structure allows for independent development and scaling of features. The multi-provider AI approach provides flexibility and redundancy. Key areas for improvement include resolving TypeScript errors, completing OAuth integration, and enhancing monitoring capabilities.

The system demonstrates good separation of concerns, comprehensive RBAC, and modern development practices. With the identified issues resolved, it can serve as a robust platform for AI-powered customer support operations.