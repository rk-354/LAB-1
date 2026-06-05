# System Architecture
# RefinerIQ — Refinery Intelligence Platform

**Version**: 2.0 (Current)
**Date**: 2026-06-05

---

## 1. Architecture Principles

1. **Single repo, single deployment** — Next.js handles both frontend and API
2. **Supabase-first** — auth, database, vectors, storage all in one managed service
3. **Local LLM primary** — Ollama runs on-device, Anthropic is the fallback
4. **RAG-grounded responses** — AI never answers from general knowledge alone
5. **Security by default** — PII masking, RLS on every table, no secrets in code
6. **Free-tier viable** — entire stack runs without a paid account

---

## 2. System Overview

```
┌─────────────────────────────────────────────────────┐
│              Next.js 14 (App Router)                │
│         Frontend + API Routes (one repo)            │
│  ┌─────────────┐  ┌────────────────────────────┐   │
│  │  React UI   │  │     /app/api/* routes      │   │
│  │  (client)   │  │  auth · chat · documents   │   │
│  │             │  │  dashboard · admin         │   │
│  └─────────────┘  └────────────┬───────────────┘   │
└───────────────────────────────┼─────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
   ┌──────────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
   │    Supabase     │  │    Ollama    │  │  Anthropic   │
   │  PostgreSQL     │  │ llama3.2:3b  │  │   Claude     │
   │  pgvector       │  │nomic-embed   │  │  (fallback)  │
   │  Auth           │  │  (local)     │  │   (cloud)    │
   │  Storage        │  └──────────────┘  └──────────────┘
   └─────────────────┘
              │
   ┌──────────▼──────────┐
   │    Elasticsearch    │
   │  (Docker, local)    │
   │  keyword search     │
   └─────────────────────┘
```

---

## 3. Components

### 3.1 Frontend — `services/frontend/`
- **Framework**: Next.js 14 App Router, TypeScript strict
- **Auth guard**: `middleware.ts` — checks Supabase session, redirects to `/login` if missing
- **Design**: Dark navy theme, Inter font, glass morphism, AI shimmer effects

### 3.2 API Layer — `services/frontend/app/api/`
All backend logic lives in Next.js API routes. No separate backend service.

| Route | Method | Purpose |
|---|---|---|
| `/api/auth` | POST / DELETE | Send magic link / sign out |
| `/api/auth/callback` | GET | Supabase OAuth redirect handler |
| `/api/chat` | GET / POST | Message history / RAG chat |
| `/api/chat/sessions` | GET | Sidebar session list |
| `/api/documents` | GET / POST | List / create document record |
| `/api/documents/ingest` | POST | Run ingestion pipeline on uploaded file |
| `/api/dashboard` | GET | Stats for admin / manager |
| `/api/admin/users` | GET / POST / PATCH | User management (admin only) |

All routes return `{ data, error }` envelope and check Supabase session first.

### 3.3 Supabase
Single managed service providing:
- **PostgreSQL**: Structured data (users, documents, sessions, audit logs)
- **pgvector**: 768-dim embeddings with HNSW index for semantic search
- **Auth**: Magic link email auth via Resend
- **Storage**: Raw uploaded files in `refinery-docs` bucket

### 3.4 LLM Layer — `services/frontend/lib/llm/`

| File | Role |
|---|---|
| `router.ts` | Tries Ollama first, falls back to Anthropic. All LLM calls go here. |
| `embeddings.ts` | Ollama `nomic-embed-text` 768-dim — for indexing + query vectorisation |
| `pii.ts` | Regex PII scan + mask before any LLM call |

**LLM priority**: Ollama `llama3.2:3b` → Anthropic `claude-haiku-4-5-20251001`

### 3.5 RAG Pipeline — `services/frontend/lib/rag/`

| File | Role |
|---|---|
| `extractor.ts` | PDF (pdf-parse / Gemini OCR), DOCX (mammoth), XLSX (xlsx), images (Gemini) |
| `chunker.ts` | Recursive splitter — 512 token target, 50 token overlap |
| `retrieval.ts` | Embeds query → pgvector cosine search → formats RAG prompt with citations |

### 3.6 Elasticsearch (Docker)
BM25 keyword search, complements pgvector semantic search. Runs via `docker-compose up`.

---

## 4. Data Flows

### Document Upload → Index
```
User uploads file
  → Supabase Storage (refinery-docs bucket)
  → POST /api/documents        — create document + version in PostgreSQL
  → POST /api/documents/ingest
       → Download from Storage
       → Extract text (pdf-parse / mammoth / xlsx / Gemini OCR)
       → Chunk (512 tokens, 50 overlap)
       → Embed each chunk (Ollama nomic-embed-text)
       → Store in document_chunks + document_embeddings (pgvector)
       → Set indexing_status = 'ready'
       → Audit log
```

### Chat Query → RAG Response
```
User sends message
  → POST /api/chat
       → PII scan → mask sensitive terms
       → Get/create chat_session
       → Save user message
       → Embed query (Ollama nomic-embed-text)
       → match_documents() → top-5 chunks (pgvector cosine)
       → Build RAG prompt with numbered sources
       → LLM Router → Ollama → (fallback) Anthropic
       → Response with [1][2] inline citations
       → Save assistant message + citations JSONB + token_usage
```

### Authentication Flow
```
User enters email → POST /api/auth → Supabase sends magic link (Resend)
User clicks link  → GET /api/auth/callback → session cookie set → redirect /
middleware.ts validates session on every subsequent request
```

---

## 5. Security

| Layer | Control |
|---|---|
| Route protection | `middleware.ts` — Supabase session required |
| Database | RLS on all tables, role-aware policies |
| Role enforcement | admin / manager / end_user checked in every API route |
| PII | Scan + mask before every LLM call, logged to `pii_detections` |
| Secrets | `.env.local` only — gitignored, never committed |
| Audit trail | Append-only `audit_logs`, no UPDATE/DELETE allowed |

---

## 6. Environments

| Env | Frontend | Services |
|---|---|---|
| Development | `npm run dev` (localhost:3000) | `docker-compose up` + Ollama native |
| Staging | Cloudflare Pages (staging branch) | Same |
| Production | Cloudflare Pages (main branch) | Same |

---

## 7. Key Decisions

| Decision | Rationale |
|---|---|
| Next.js API routes only | Single repo, single deployment — no separate backend service |
| Supabase pgvector | Vector search built into the DB — no extra service needed |
| Ollama primary | Free, local, zero API cost for demo queries |
| Anthropic fallback | User has credits; Haiku is cost-effective |
| Gemini for OCR only | Best accuracy for scanned docs; cost contained (OCR is rare) |
| Single tenant | Halves feature complexity for MVP |
| No Redis | Supabase + Next.js sufficient for MVP scale |
