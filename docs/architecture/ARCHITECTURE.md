# System Architecture Design
# RefinerIQ — Refinery Intelligence Platform

**Version**: 0.1 (Draft)
**Date**: 2026-06-04

---

## 1. Architecture Principles

1. **Free-tier first** — every component has a no-cost operational mode
2. **Modular services** — each service independently deployable via Docker
3. **LLM-agnostic** — swap models via config, not code changes
4. **Security by default** — PII scrubbing, RBAC, audit logs everywhere
5. **Observable** — structured logs, metrics, distributed tracing
6. **RAG-first** — AI responses grounded in documents, always cited

---

## 2. System Components

### 2.1 Frontend (Next.js 14)
- **Path**: `services/frontend/`
- Chat interface with streaming Server-Sent Events (SSE)
- Document upload and version history
- Admin dashboard (usage, logs, token metrics)
- Tailwind CSS + shadcn/ui components
- Auth: JWT stored in httpOnly cookies

### 2.2 API Gateway (FastAPI)
- **Path**: `services/api/`
- Single entry point for all client requests
- Responsibilities: JWT validation, RBAC enforcement, rate limiting, PII pre-scan
- Routes requests to the appropriate agent or service
- Returns `{ data, error, meta }` envelope on every response
- WebSocket endpoint for streaming chat

### 2.3 Agent Orchestrator (LangGraph)
- **Path**: `services/agents/`
- Stateful graph-based multi-agent system
- Nodes: OrchestratorAgent → [OpsAgent | HRAgent | ComplianceAgent | DocAgent | AnalyticsAgent]
- Each agent has: system prompt, tool set, memory, token budget
- Agent handoffs preserve conversation state
- All agent calls logged with: input tokens, output tokens, model used, latency

### 2.4 LLM Router
- **Path**: `services/agents/llm_router.py`
- Priority order: `Ollama → Groq → OpenAI → Anthropic`
- Selection criteria: task type, model size needed, current latency, token budget
- Response caching layer (Redis): identical prompts within TTL return cached response
- Tracks token usage per user/session

### 2.5 Document Ingestion Pipeline
- **Path**: `services/ingestion/`
- Accepts: PDF, DOCX, XLSX, CSV, TXT, PNG, JPG
- Pipeline: Upload → OCR (if needed) → Text extraction → Chunking → Embedding → Index
- Chunking strategy: recursive character splitter, 512 tokens, 50 overlap
- Embeddings: `nomic-embed-text` via Ollama (free, local)
- Stores: raw file in MinIO, chunks+embeddings in ChromaDB, metadata in PostgreSQL

### 2.6 OCR Service
- **Path**: `services/ocr/`
- Tesseract 5 for standard documents
- PaddleOCR for complex layouts / non-English
- Returns: extracted text + bounding box metadata

### 2.7 Search Service (Elasticsearch)
- BM25 full-text index across all document chunks
- Facets: department, document type, date range, author, role
- Used for keyword search; vector search via ChromaDB
- Hybrid retrieval: RRF (Reciprocal Rank Fusion) merges both result sets

---

## 3. Data Flow

### 3.1 Document Upload Flow
```
User → Upload API → Auth/RBAC check
  → Store raw file (MinIO)
  → Extract text (OCR if needed)
  → Chunk text (recursive splitter)
  → Generate embeddings (Ollama nomic-embed-text)
  → Store chunks (ChromaDB)
  → Index full text (Elasticsearch)
  → Store metadata (PostgreSQL: doc_id, version, uploader, dept, timestamp)
  → Return: { doc_id, version, chunk_count, status }
```

### 3.2 Chat Query Flow
```
User → Chat API → Auth/RBAC → PII scan (Presidio)
  → Orchestrator Agent (LangGraph)
    → Classify intent → Route to specialist agent
    → Hybrid retrieval (ChromaDB + Elasticsearch)
    → Re-rank chunks (cross-encoder)
    → Build prompt with context + citations
    → LLM Router → select model → check Redis cache
      → (cache hit) return cached response
      → (cache miss) call LLM → cache response
    → Format response with citations
    → Log: user, query, docs retrieved, model, tokens, latency
  → Stream response to client via SSE
  → Sentiment analysis on user feedback (async)
```

### 3.3 Authentication Flow
```
User → POST /auth/login → Validate credentials (PostgreSQL)
  → Generate JWT (access: 60min, refresh: 7days)
  → Return tokens in httpOnly cookies
  → All subsequent requests: validate JWT → extract role → enforce RBAC
```

---

## 4. Multi-Agent Architecture

```
┌──────────────────────────────────────────────┐
│            OrchestratorAgent                 │
│  - Classifies intent                         │
│  - Routes to specialist                      │
│  - Aggregates multi-agent responses          │
│  - Enforces token budget                     │
└──┬────────┬──────────┬───────────┬───────────┘
   │        │          │           │
┌──▼──┐  ┌──▼──┐  ┌────▼───┐  ┌───▼────┐
│ Ops │  │ HR  │  │Complnc │  │DocGen  │
│Agent│  │Agent│  │ Agent  │  │ Agent  │
└──┬──┘  └──┬──┘  └────┬───┘  └───┬────┘
   │        │          │           │
   └────────┴──────────┴───────────┘
                    │
            ┌───────▼───────┐
            │  LLM Router   │
            │ Ollama/Groq   │
            │ OpenAI/Anthro │
            └───────────────┘
```

### Agent Responsibilities
| Agent | Domain | Tools |
|---|---|---|
| OrchestratorAgent | Routing, aggregation | intent_classifier, agent_handoff |
| OpsAgent | Equipment, maintenance, incidents | rag_search, doc_retriever |
| HRAgent | Policies, onboarding, org chart | rag_search, employee_db |
| ComplianceAgent | Regulatory, audits | rag_search, citation_formatter |
| DocAgent | General document Q&A | rag_search, hybrid_search |
| AnalyticsAgent | Summaries, trends, sentiment | sql_query, aggregator |

---

## 5. Database Architecture

### 5.1 PostgreSQL (Primary)
Stores: users, roles, documents metadata, file versions, audit logs, token usage, HR data, operations data, incidents

### 5.2 ChromaDB (Vector)
Stores: document chunks, embeddings, chunk metadata (doc_id, page, chunk_idx)
Collections: `refinery_docs` (all documents), optionally per-department collections

### 5.3 Redis
Stores: LLM response cache (key: hash of prompt+model), user sessions, rate limit counters
TTL: LLM cache = 1 hour, sessions = 60 min

### 5.4 MinIO (Object Storage)
Stores: raw uploaded files, versioned files
Bucket structure: `refinery-docs/{dept}/{doc_id}/{version}/{filename}`

### 5.5 Elasticsearch
Stores: document text chunks (BM25 index), search analytics

---

## 6. Security Architecture

| Layer | Control |
|---|---|
| Transport | HTTPS / TLS everywhere |
| Authentication | JWT (RS256), httpOnly cookies |
| Authorization | RBAC — 6 roles, resource-level permissions |
| PII | Presidio scan on all user input; PII masked before LLM |
| Secrets | Never in code; env vars only; `.env` in `.gitignore` |
| Dependencies | Safety scan in CI (Python), npm audit (Node) |
| Secrets Scanning | TruffleHog in CI pipeline |
| Rate Limiting | Per-user, per-endpoint via Redis |
| Input Validation | Pydantic models (API), Zod (frontend) |
| Audit Logs | Immutable append-only log: user + action + timestamp + resource |

---

## 7. Observability Stack

| Layer | Tool | Cost |
|---|---|---|
| Structured Logging | structlog (Python) + Pino (Node) | Free |
| Log Aggregation | Loki (docker-compose) | Free |
| Metrics | Prometheus + Grafana | Free |
| Error Tracking | Sentry (5k events/month free tier) | Free |
| Distributed Tracing | OpenTelemetry + Jaeger | Free |

---

## 8. Deployment Architecture

### docker-compose (Dev & Demo)
All services run locally via docker-compose:
- `docker-compose.yml` — development
- `docker-compose.staging.yml` — staging overrides
- `docker-compose.prod.yml` — production hardening

### Environment Promotion
```
Developer Machine (docker-compose dev)
    ↓ PR merged to develop
GitHub Actions CI (lint, test, build)
    ↓ merge to staging branch
Staging Environment (docker-compose staging)
    ↓ manual approval gate
Production (docker-compose prod)
```

---

## 9. LLM Token Optimization Strategy

1. **Response caching**: Redis cache — identical queries return cached response (saves 100% tokens)
2. **Prompt compression**: Remove redundant whitespace, truncate long contexts
3. **Chunk limiting**: Max 5 retrieved chunks per RAG query
4. **Model tiering**: Simple queries → Ollama local (free); complex → Groq (fast+cheap free tier)
5. **Streaming**: First-token latency optimized via SSE streaming
6. **Token counting**: tiktoken tracks all usage before/after LLM call
7. **Budget enforcement**: Per-user daily token budget configurable by admin
