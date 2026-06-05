# Database Design
# RefinerIQ — Refinery Intelligence Platform

**Version**: 2.0 (Current — matches migrations in `supabase/migrations/`)
**Date**: 2026-06-05

---

## 1. Database Summary

| Database | Engine | Purpose |
|---|---|---|
| Primary + Vector | Supabase PostgreSQL + pgvector | All structured data + semantic embeddings |
| File Storage | Supabase Storage | Raw uploaded files (bucket: `refinery-docs`) |
| Search Index | Elasticsearch 8 (Docker) | Full-text BM25 keyword search |

**Removed from stack**: Redis, ChromaDB, MinIO — all replaced by Supabase.

---

## 2. Schema (matches `supabase/migrations/`)

### Migration 001 — Auth & RBAC

**`public.roles`**
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| name | VARCHAR(50) UNIQUE | `admin`, `manager`, `end_user` |
| description | TEXT | |
| created_at | TIMESTAMPTZ | |

Seeded: `admin`, `manager`, `end_user`

**`public.profiles`** — extends `auth.users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | References `auth.users(id)` |
| full_name | VARCHAR(255) | |
| employee_id | VARCHAR(100) UNIQUE | |
| department | VARCHAR(100) | `hr` or `operations` |
| role_id | INT FK | References `roles(id)`, default 3 (end_user) |
| is_active | BOOLEAN | Default TRUE |
| created_at / updated_at | TIMESTAMPTZ | |

Auto-created on signup via `handle_new_user()` trigger.

---

### Migration 002 — Departments

**`public.departments`**
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| slug | VARCHAR(50) UNIQUE | `hr`, `operations` |
| name | VARCHAR(100) | Full display name |
| short_code | VARCHAR(10) | `HR`, `OPS` |
| description | TEXT | |
| is_active | BOOLEAN | |

Seeded: `hr` (Human Resources), `operations` (Operations)

---

### Migration 003 — Document Management

**`public.documents`**
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| title | VARCHAR(500) | |
| description | TEXT | |
| department_slug | VARCHAR(50) FK | References `departments(slug)` |
| doc_type | VARCHAR(50) | `sop`, `policy`, `report`, `manual`, `form`, `general` |
| tags | TEXT[] | |
| uploaded_by | UUID FK | References `profiles(id)` |
| current_version | INT | Default 1 |
| is_active | BOOLEAN | |

**`public.document_versions`**
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| document_id | UUID FK | |
| version_number | INT | Unique per document |
| storage_path | VARCHAR(1000) | Path in Supabase Storage bucket |
| file_name | VARCHAR(500) | |
| file_size | BIGINT | Bytes |
| mime_type | VARCHAR(100) | |
| checksum | VARCHAR(64) | SHA-256 |
| ocr_processed | BOOLEAN | |
| indexed | BOOLEAN | |
| indexing_status | VARCHAR(20) | `pending` → `processing` → `ready` / `error` |
| uploaded_by | UUID FK | |
| change_notes | TEXT | |

**`public.document_chunks`** — chunk metadata only
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| document_id | UUID FK | |
| version_number | INT | |
| chunk_index | INT | |
| page_number | INT | Estimated from character position |
| section | VARCHAR(500) | |
| text_preview | VARCHAR(500) | First 500 chars |
| token_count | INT | |

**`public.document_embeddings`** — pgvector table
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| chunk_id | UUID UNIQUE FK | References `document_chunks(id)` |
| document_id | UUID FK | |
| department_slug | VARCHAR(50) | For department-scoped retrieval |
| embedding | vector(768) | Ollama nomic-embed-text output |
| chunk_text | TEXT | Full chunk text passed to LLM |
| metadata | JSONB | `{filename, page_number, title, chunk_index}` |

**HNSW index**: `USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64)`

**Semantic search function**: `match_documents(query_embedding, dept_slug, match_count, match_threshold)`  
Returns chunks ordered by cosine similarity above threshold.

---

### Migration 004 — Chat

**`public.chat_sessions`**
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| title | VARCHAR(500) | Auto-set from first message |
| department_slug | VARCHAR(50) FK | |
| is_active | BOOLEAN | |

**`public.chat_messages`**
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| session_id | UUID FK | |
| role | VARCHAR(20) | `user`, `assistant`, `system` |
| content | TEXT | |
| citations | JSONB | `[{id, doc, page, dept}]` |
| model_used | VARCHAR(100) | e.g. `llama3.2:3b` |
| provider | VARCHAR(50) | `ollama`, `anthropic`, `gemini` |
| input_tokens | INT | |
| output_tokens | INT | |
| latency_ms | INT | |
| cached | BOOLEAN | |
| has_pii | BOOLEAN | PII detected in original input |
| pii_masked | BOOLEAN | PII was masked before LLM |
| feedback | VARCHAR(10) | `up`, `down`, NULL |

---

### Migration 005 — Token Usage

**`public.token_usage`**
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK | |
| session_id | UUID FK | |
| message_id | UUID FK | |
| model | VARCHAR(100) | |
| provider | VARCHAR(50) | |
| input_tokens | INT | |
| output_tokens | INT | |
| cached | BOOLEAN | |
| cost_usd | NUMERIC(10,6) | 0 for local/free tier |

**`public.daily_token_usage`** — VIEW  
Aggregates `total_tokens`, `total_cost`, `query_count` per `user_id` per `usage_date`.

---

### Migration 006 — Audit Logs

**`public.audit_logs`** — append-only
| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL PK | |
| user_id | UUID FK | |
| action | VARCHAR(100) | `upload_doc`, `query`, `login`, `invite_user`, `index_doc` |
| resource | VARCHAR(100) | `document`, `user`, `chat_session` |
| resource_id | VARCHAR(255) | |
| department_slug | VARCHAR(50) | |
| metadata | JSONB | Extra context |
| ip_address | INET | |
| created_at | TIMESTAMPTZ | |

Rules prevent UPDATE and DELETE — append-only enforced at DB level.  
Helper: `log_action(user_id, action, resource, resource_id, dept_slug, metadata)`

---

### Migration 007 — PII Detection

**`public.pii_detections`**
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| message_id | UUID FK | References `chat_messages(id)` |
| user_id | UUID FK | |
| pii_types | TEXT[] | `['EMAIL', 'PHONE', 'EMPLOYEE_ID', ...]` |
| token_count | INT | |
| masked | BOOLEAN | Always TRUE in current implementation |

---

## 3. Row Level Security

Every table has RLS enabled. Key policies:

| Table | End User | Manager | Admin |
|---|---|---|---|
| `profiles` | Own row only | Own row only | All rows |
| `documents` | Own dept only | Own dept only | All |
| `document_embeddings` | Own dept only | Own dept only | All |
| `chat_sessions` | Own sessions | Own sessions | All |
| `chat_messages` | Own sessions | Own sessions | All |
| `token_usage` | Own rows | Own rows | All |
| `audit_logs` | No read | No read | All |
| `pii_detections` | No read | No read | All |

Service role (used in admin API client) bypasses RLS.

---

## 4. Supabase Storage

Bucket: `refinery-docs`  
Path pattern: `{department_slug}/{document_id}/v{version}/{filename}`

Files are downloaded server-side in the ingestion pipeline — never exposed directly to the browser.

---

## 5. Indexes

```sql
-- Profiles
idx_profiles_role         ON profiles(role_id)
idx_profiles_department   ON profiles(department)

-- Documents
idx_documents_dept        ON documents(department_slug)
idx_documents_type        ON documents(doc_type)
idx_doc_versions_doc      ON document_versions(document_id)
idx_doc_versions_status   ON document_versions(indexing_status)
idx_chunks_doc            ON document_chunks(document_id)
idx_embeddings_doc        ON document_embeddings(document_id)
idx_embeddings_dept       ON document_embeddings(department_slug)
HNSW index                ON document_embeddings(embedding vector_cosine_ops)

-- Chat
idx_sessions_user         ON chat_sessions(user_id)
idx_messages_session      ON chat_messages(session_id)
idx_messages_created      ON chat_messages(created_at DESC)

-- Token + Audit
idx_token_usage_user_date ON token_usage(user_id, created_at DESC)
idx_audit_user            ON audit_logs(user_id)
idx_audit_created         ON audit_logs(created_at DESC)
idx_audit_action          ON audit_logs(action)
```
