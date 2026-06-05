# RefinerIQ — Product Requirements Document
**Version**: 1.0 MVP  
**Status**: Final  
**Date**: 2026-06-04

---

## 1. Product Summary

RefinerIQ is a single-tenant AI platform for refinery staff. It gives operators, HR personnel, and managers one interface to ask questions, upload documents, and get cited, grounded answers — powered by RAG over their own internal documents.

The primary interface is a chat window. Everything else (dashboard, admin, document library) supports it.

---

## 2. Problem

Refinery staff work across two knowledge-heavy departments — Operations and HR. Documents live in folders, people rely on institutional memory, and finding the right SOP or policy takes too long. There is no way to ask a question and get a sourced answer in seconds.

---

## 3. MVP Scope

Two departments. Three roles. One chat interface. RAG over uploaded documents.

---

## 4. Core User Stories

### Admin
- As Admin, I can invite users and assign them a role and department
- As Admin, I can upload, manage, and delete documents for any department
- As Admin, I can see token usage, active users, and system health on a dashboard
- As Admin, I can view full audit logs of who asked what and which documents were used

### Manager
- As Manager, I can upload and manage documents for my department
- As Manager, I can see department-level dashboard (queries, top documents, usage)
- As Manager, I can chat and get answers with citations from my department's documents

### End User
- As End User, I can chat and ask questions about HR or Operations documents
- As End User, I can upload documents to my department (subject to Manager approval)
- As End User, I can see my own conversation history
- As End User, I can give thumbs up/down feedback on any AI response

---

## 5. Features — MVP

### 5.1 Chat
- Streaming responses (token by token)
- Multi-turn conversation with context memory (session-scoped)
- Citations on every AI response: `[Source: filename, Page N]`
- Response confidence indicator
- Thumbs up / down feedback per message
- New conversation button
- Conversation history sidebar

### 5.2 RAG Pipeline
- Upload triggers: OCR (Gemini) → text extraction → chunking → embedding → index
- Hybrid retrieval: pgvector semantic search + Elasticsearch keyword search
- Re-ranking before final response
- Department-scoped retrieval (End User only sees their department's docs)
- LLM response caching — identical queries return cached result

### 5.3 Document Management
- Upload: PDF, DOCX, XLSX, PNG, JPG, scanned images
- Department tagging on upload
- Document list view with search and filter
- Delete document (Admin / Manager only)
- View document metadata (uploader, date, status)
- Indexing status indicator (processing → ready)

### 5.4 RBAC

| Action | Admin | Manager | End User |
|---|---|---|---|
| Chat (own dept) | ✅ | ✅ | ✅ |
| Chat (all depts) | ✅ | ❌ | ❌ |
| Upload docs | ✅ | ✅ | ✅ (own dept) |
| Delete docs | ✅ | ✅ (own dept) | ❌ |
| View all users | ✅ | ❌ | ❌ |
| Invite users | ✅ | ❌ | ❌ |
| Admin dashboard | ✅ | ❌ | ❌ |
| Dept dashboard | ✅ | ✅ (own dept) | ❌ |
| View audit logs | ✅ | ❌ | ❌ |

### 5.5 Dashboard
**Admin view**: Total queries today, active users, token usage, top 5 documents queried, recent audit log entries, system health (Ollama status, ES status)  
**Manager view**: Department queries today, top documents, active users in dept

### 5.6 Admin Panel
- User list (invite, edit role, deactivate)
- Department management (HR, Operations)
- Document library (all departments)
- Audit log viewer (filterable by user, date, action)
- Token usage per user

### 5.7 Auth
- Email + password login via Supabase Auth
- Password reset via Resend email
- Session management (JWT, Supabase-managed)
- Protected routes by role

### 5.8 PII
- Basic scan on all user chat input before sending to LLM
- Mask: names, emails, phone numbers, employee IDs
- Flag in audit log if PII was detected and masked

---

## 6. Departments — MVP

| Department | Document types | Primary users |
|---|---|---|
| **HR** | Policies, onboarding guides, leave rules, org charts, benefits docs | HR staff, all employees (read) |
| **Operations** | SOPs, equipment manuals, maintenance logs, incident reports, safety procedures | Operators, Managers |

---

## 7. LLM Strategy

| Task | Model | Reason |
|---|---|---|
| Chat / RAG responses | Ollama llama3.2:3b (primary) | Free, local, fast |
| Chat / RAG fallback | Anthropic Claude | Quality fallback when local fails |
| OCR | Gemini API | Best-in-class for document OCR |
| Embeddings | Ollama nomic-embed-text | Free, local, high quality |

Routing logic: try Ollama first → if unavailable or task complexity high → Anthropic.

---

## 8. Non-Functional Requirements (MVP)

| NFR | Target |
|---|---|
| Chat first-token latency | < 2 seconds |
| Document indexing (10-page PDF) | < 60 seconds |
| Uptime (demo) | 99% on local machine |
| PII detection recall | > 90% |
| Test coverage | > 70% |
| Response always includes citation | 100% |

---

## 9. Out of Scope (MVP)

- Multi-tenancy
- Real SCADA / ERP / SAP integration
- File version control
- Mobile app
- Sentiment analysis (deferred)
- Active auto-reindex on doc change (manual trigger for MVP)
- 4th LLM
- Email notifications beyond auth

---

## 10. Open Items

| Item | Decision needed by |
|---|---|
| LLM #4 | Dev phase |
| PII masking depth (regex vs model) | Design phase |
| Production hosting for Docker services | Pre-deployment |
