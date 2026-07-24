Multi Tenant Architecture
Super Admin
    │
    ├── Organization A
    │      ├── Admin
    │      ├── Support
    │      └── Customers
    │
    ├── Organization B
    │      ├── Admin
    │      ├── Support
    │      └── Customers
    │
    └── Organization C

Each organization has

Separate users
Separate documents
Separate FAQ
Separate tickets
Separate chatbot history
Separate vector index
Separate storage folder

Every table contains

tenant_id
organization_id

No organization can access another organization's data.

3. User Roles
Super Admin (Tenant Owner)

Responsibilities

Create Organization
Suspend Organization
Delete Organization
User Management
Organization Management
Audit Logs
Subscription Management
Storage Usage
AI Usage Monitoring
API Key Management
Platform Settings
Company Admin

Responsibilities

User Management
Create Users
Update Users
Delete Users
Reset Password
Assign Roles
Role Management

Example Roles

HR
Sales
Customer
Finance
Support
Manager
Document Management

Upload

PDF
DOCX
TXT

Categories

HR Policies
Customer Policies
Product Manuals
Warranty
Technical Guides
SOP
Pricing Documents

Approval Flow

Upload
      ↓
Verification
      ↓
Approved
      ↓
Index to Vector DB
      ↓
Available to Chatbot
Role Based Document Access

Example

Document
HR Policy

Allowed Roles

HR
Manager

Customer cannot access.

Example

Product Manual

Allowed

Customer
Support
Sales
FAQ Management

Admin

Create FAQ
Update FAQ
Delete FAQ
Approve Support FAQ
Ticket Management
View Tickets
Assign Support Agent
Close Ticket
Reopen Ticket
Export History
Chat History
View Customer Chats
Search
Delete
Export

Dashboard

Statistics

Total Users
Active Customers
Total Documents
AI Requests
Tickets
Open Tickets
Closed Tickets
Storage Used
Support

Responsibilities

Customer Chat
View Customer Chat
Reply
Escalate
Ticket
Create
Reply
Close
FAQ

Support creates FAQ

Status

Draft

↓

Pending Approval

↓

Approved by Admin

↓

Published
Document Upload

Support uploads documents

Admin approval required.

AI Chat

Support can use AI.

AI only searches documents assigned to Support role.

Customer

Features

Dashboard

My Chats
My Tickets
FAQ
AI Chat

Customer Chatbot

Example

Customer asks

What is product warranty?

AI answers.

Customer asks

HR Leave Policy?

Customer role doesn't have HR document access.

AI responds

I couldn't find information available for your role.

NOT

Return HR policy.

Customer can

Create Ticket
View Ticket
Chat
Search FAQ
4. Document Upload Pipeline
Upload PDF
      │
Virus Scan
      │
Metadata Extraction
      │
OCR (optional)
      │
Text Extraction
      │
Chunking
      │
Embedding
      │
Store Embedding
      │
Store Original File
      │
Ready for Chat
5. RAG Architecture
User Question

↓

Authentication

↓

Identify Tenant

↓

Identify User Role

↓

Get Allowed Documents

↓

Similarity Search

↓

Top K Chunks

↓

Prompt Builder

↓

LLM

↓

Answer

↓

Store Chat History
6. Security Filter Before RAG
Question

↓

User Role

↓

Allowed Document IDs

↓

Vector Search Only on Allowed Docs

↓

LLM

↓

Answer

Example

Customer

Allowed

Product Manual
Warranty
Customer Policy

Blocked

HR Policy
Finance Policy
Salary Policy

Even if the vector database contains HR documents, they are excluded from retrieval for customers.

7. Ticket Module

Entities

Ticket

Ticket Message

Attachment

Status

Priority

Category

Status

Open

Assigned

Pending

Resolved

Closed

Priority

Low

Medium

High

Critical
8. FAQ Module
Category

Question

Answer

Created By

Approved By

Status
9. Chat Module
Conversation

Messages

Role

Prompt

Retrieved Docs

AI Response

Feedback

Timestamp
10. Search Module

Search

FAQ
Documents
Tickets
Chats

Filters

Category
Date
User
Status
Document
11. Database Design (Core Tables)
Tenant
tenant
--------
id
name
status
plan
created_at
Organization
organization
------------
id
tenant_id
name
logo
status
User
users
-----
id
tenant_id
organization_id
role_id
name
email
password
status
Roles
roles
------
id
tenant_id
name
Documents
documents
---------
id
tenant_id
organization_id
title
category
file_path
status
uploaded_by
approved_by
Document Role Access
document_role_access
--------------------
document_id
role_id
FAQ
faq
---
id
tenant_id
question
answer
status
approved_by
Tickets
tickets
-------
id
tenant_id
customer_id
assigned_to
status
priority
Chat History
chat_history
------------
id
tenant_id
user_id
conversation_id
question
answer
Audit Logs
audit_logs
----------
id
tenant_id
user_id
action
entity
timestamp
12. Recommended Technology Stack
Layer	Technology
Frontend	React.js / Next.js
UI	Material UI / Tailwind CSS
Backend	Spring Boot (Java)
Security	Spring Security + JWT + OAuth2
API	REST (optional GraphQL for analytics)
Database	PostgreSQL
Cache	Redis
File Storage	MinIO (on-prem) or AWS S3
Search	PostgreSQL Full-Text or Elasticsearch
Vector Database	Qdrant (recommended) or Pinecone
Embeddings	OpenAI, Azure OpenAI, or BGE (offline)
LLM	OpenAI GPT, Azure OpenAI, Gemini, or local Ollama/Llama
Document Parsing	Apache Tika, PDFBox, Tesseract OCR
Background Jobs	RabbitMQ or Kafka + Spring Scheduler
Monitoring	Prometheus + Grafana
Logging	ELK Stack (Elasticsearch, Logstash, Kibana)
Containerization	Docker
Orchestration	Kubernetes (production)
13. Overall Workflow
Super Admin
      │
Create Organization
      │
Create Company Admin
      │
──────────────────────────────────────────────
Company Admin
      │
Create Roles
      │
Create Users
      │
Upload Documents
      │
Approve Documents
      │
Assign Document Access to specific role
      │
Generate Embeddings
      │
Ready for AI
──────────────────────────────────────────────
Customer
      │
Login
      │
Ask Question
      │
Authentication
      │
Tenant Resolution
      │
Role Validation
      │
Retrieve Authorized Document Chunks
      │
LLM Generates Answer
      │
Save Chat History
──────────────────────────────────────────────
If AI Confidence Low
      │
Create Support Ticket
      │
Assign Support Agent
      │
Support Replies
      │
Customer Notified
Key Security Principle

The RAG layer must enforce tenant isolation and role-based document filtering before retrieval. Every AI query should first resolve the user's tenant_id and role_id, then search only vector embeddings for documents the role is authorized to access. If no relevant authorized content exists, the AI should respond with a message such as "I couldn't find information available for your role or in the approved knowledge base." This prevents exposure of unrelated content (e.g., a customer asking about an HR leave policy) and ensures answers are grounded only in approved, accessible documents.