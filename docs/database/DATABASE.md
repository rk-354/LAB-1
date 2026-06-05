# Database Design
# RefinerIQ — Refinery Intelligence Platform

**Version**: 0.1 (Draft)
**Date**: 2026-06-04

---

## 1. Database Summary

| Database | Engine | Purpose |
|---|---|---|
| Primary | PostgreSQL 16 | Structured data: users, docs metadata, audit, HR, ops, tokens |
| Vector | ChromaDB | Document embeddings for semantic search |
| Cache | Redis 7 | LLM response cache, sessions, rate limits |
| Object Store | MinIO | Raw file storage (versioned) |
| Search Index | Elasticsearch 8 | Full-text BM25 search over document chunks |

---

## 2. PostgreSQL Schema

### 2.1 Auth & RBAC

```sql
-- Roles
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,  -- admin, manager, operator, hr, compliance, viewer
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name    VARCHAR(255) NOT NULL,
    employee_id  VARCHAR(100) UNIQUE,
    department   VARCHAR(100),
    role_id      INT REFERENCES roles(id) NOT NULL,
    is_active    BOOLEAN DEFAULT TRUE,
    last_login   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions
CREATE TABLE permissions (
    id          SERIAL PRIMARY KEY,
    resource    VARCHAR(100) NOT NULL,  -- 'document', 'hr_record', 'ops_log'
    action      VARCHAR(50) NOT NULL,   -- 'read', 'write', 'delete', 'upload'
    role_id     INT REFERENCES roles(id),
    UNIQUE(resource, action, role_id)
);
```

### 2.2 Document Management

```sql
-- Documents
CREATE TABLE documents (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         VARCHAR(500) NOT NULL,
    description   TEXT,
    department    VARCHAR(100),
    doc_type      VARCHAR(50),          -- 'sop', 'policy', 'report', 'form', 'manual'
    tags          TEXT[],
    uploaded_by   UUID REFERENCES users(id),
    current_version INT DEFAULT 1,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Document Versions
CREATE TABLE document_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_number  INT NOT NULL,
    file_path       VARCHAR(1000) NOT NULL,   -- MinIO path
    file_name       VARCHAR(500) NOT NULL,
    file_size       BIGINT,
    mime_type       VARCHAR(100),
    checksum        VARCHAR(64),              -- SHA-256
    ocr_processed   BOOLEAN DEFAULT FALSE,
    indexed         BOOLEAN DEFAULT FALSE,
    uploaded_by     UUID REFERENCES users(id),
    change_notes    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, version_number)
);

-- Document Access Control
CREATE TABLE document_access (
    document_id  UUID REFERENCES documents(id) ON DELETE CASCADE,
    role_id      INT REFERENCES roles(id),
    can_read     BOOLEAN DEFAULT TRUE,
    can_download BOOLEAN DEFAULT FALSE,
    PRIMARY KEY(document_id, role_id)
);

-- Document Chunks (metadata only — vectors in ChromaDB)
CREATE TABLE document_chunks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_number  INT NOT NULL,
    chunk_index     INT NOT NULL,
    page_number     INT,
    section         VARCHAR(500),
    text_preview    VARCHAR(500),             -- first 500 chars for display
    chroma_chunk_id VARCHAR(255) UNIQUE,      -- ChromaDB chunk ID
    token_count     INT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Conversations & Chat

```sql
-- Chat Sessions
CREATE TABLE chat_sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES users(id),
    title        VARCHAR(500),
    agent_type   VARCHAR(50),   -- 'orchestrator', 'ops', 'hr', 'compliance', 'doc'
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,    -- 'user', 'assistant', 'system'
    content         TEXT NOT NULL,
    citations       JSONB,                  -- [{doc_id, version, page, chunk_id, text}]
    model_used      VARCHAR(100),
    input_tokens    INT,
    output_tokens   INT,
    latency_ms      INT,
    confidence      FLOAT,
    has_pii         BOOLEAN DEFAULT FALSE,
    pii_masked      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- User Feedback / Sentiment
CREATE TABLE message_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID REFERENCES chat_messages(id),
    user_id         UUID REFERENCES users(id),
    rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    sentiment_score FLOAT,                  -- Presidio/LLM derived
    sentiment_label VARCHAR(20),            -- positive, neutral, negative
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 Token Usage & LLM Tracking

```sql
-- Token Usage
CREATE TABLE token_usage (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    session_id      UUID REFERENCES chat_sessions(id),
    message_id      UUID REFERENCES chat_messages(id),
    model           VARCHAR(100) NOT NULL,
    provider        VARCHAR(50) NOT NULL,    -- ollama, openai, groq, anthropic
    input_tokens    INT NOT NULL,
    output_tokens   INT NOT NULL,
    cached          BOOLEAN DEFAULT FALSE,   -- Redis cache hit
    cost_usd        NUMERIC(10,6) DEFAULT 0, -- 0 for local/free tier
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Token Budgets
CREATE TABLE token_budgets (
    id          SERIAL PRIMARY KEY,
    user_id     UUID REFERENCES users(id) UNIQUE,
    daily_limit INT DEFAULT 100000,
    used_today  INT DEFAULT 0,
    reset_date  DATE DEFAULT CURRENT_DATE
);
```

### 2.5 HR Module

```sql
-- Employees
CREATE TABLE employees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    designation     VARCHAR(200),
    department      VARCHAR(100),
    manager_id      UUID REFERENCES employees(id),
    join_date       DATE,
    employment_type VARCHAR(50),    -- fulltime, contract, trainee
    status          VARCHAR(50) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- HR Documents (policies, onboarding, etc.)
CREATE TABLE hr_documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    category    VARCHAR(100),   -- 'policy', 'onboarding', 'benefits', 'leave'
    effective_date DATE,
    expiry_date    DATE,
    is_mandatory   BOOLEAN DEFAULT FALSE
);
```

### 2.6 Operations Module

```sql
-- Equipment
CREATE TABLE equipment (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag       VARCHAR(100) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    category        VARCHAR(100),   -- 'pump', 'valve', 'vessel', 'compressor'
    location        VARCHAR(255),
    unit            VARCHAR(100),   -- refinery unit / plant area
    status          VARCHAR(50) DEFAULT 'operational',
    last_maintained TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Logs
CREATE TABLE maintenance_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id    UUID REFERENCES equipment(id),
    performed_by    UUID REFERENCES users(id),
    log_type        VARCHAR(50),    -- 'preventive', 'corrective', 'inspection'
    description     TEXT,
    findings        TEXT,
    next_due        DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents
CREATE TABLE incidents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by     UUID REFERENCES users(id),
    equipment_id    UUID REFERENCES equipment(id),
    severity        VARCHAR(20),    -- 'low', 'medium', 'high', 'critical'
    title           VARCHAR(500),
    description     TEXT,
    root_cause      TEXT,
    corrective_action TEXT,
    status          VARCHAR(50) DEFAULT 'open',
    occurred_at     TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.7 Audit Logs

```sql
-- Audit Log (append-only, never update or delete)
CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,   -- 'upload_doc', 'query', 'login', 'delete_doc'
    resource    VARCHAR(100),
    resource_id VARCHAR(255),
    metadata    JSONB,                  -- extra context (IP, user agent, etc.)
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

---

## 3. ChromaDB Collections

### Collection: `refinery_docs`
```json
{
  "id": "chunk_uuid",
  "embedding": [float, ...],
  "document": "chunk text content",
  "metadata": {
    "document_id": "uuid",
    "version_number": 1,
    "chunk_index": 5,
    "page_number": 3,
    "department": "operations",
    "doc_type": "sop",
    "title": "Equipment Shutdown Procedure",
    "roles_allowed": ["admin", "manager", "operator"],
    "created_at": "2026-06-04T00:00:00Z"
  }
}
```

---

## 4. Redis Key Patterns

| Key Pattern | Value | TTL | Purpose |
|---|---|---|---|
| `llm_cache:{hash}` | JSON response | 3600s | LLM response dedup |
| `session:{jwt_jti}` | user_id + role | 3600s | Session validation |
| `ratelimit:{user_id}:{endpoint}` | count | 60s | Rate limiting |
| `token_budget:{user_id}:{date}` | tokens used | 86400s | Daily token tracking |

---

## 5. Indexes

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_docs_dept ON documents(department);
CREATE INDEX idx_docs_type ON documents(doc_type);
CREATE INDEX idx_doc_versions_doc ON document_versions(document_id);
CREATE INDEX idx_chunks_doc ON document_chunks(document_id);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_token_usage_user_date ON token_usage(user_id, created_at DESC);
CREATE INDEX idx_incidents_severity ON incidents(severity, status);
```
