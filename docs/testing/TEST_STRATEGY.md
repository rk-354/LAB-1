# Test Strategy — RefinerIQ MVP

## Approach: Test what matters, skip what doesn't

Three layers. Each has a clear job.

---

## 1. Unit Tests — `tests/unit/`
**Tool**: Vitest  
**What**: Pure functions and library utilities only  
**Target**: 70% coverage on `lib/`

| Module | What to test |
|---|---|
| `lib/llm/router.ts` | Routing logic (Ollama → Anthropic fallback), cache hit/miss |
| `lib/rag/chunker.ts` | Chunk sizes, overlap, edge cases (empty doc, single sentence) |
| `lib/rag/retrieval.ts` | RRF merge logic, top-N selection |
| `lib/pii/scan.ts` | Detects names, emails, phone numbers, employee IDs |
| `lib/pii/mask.ts` | Correct masking output, original text not leaked |
| `lib/ocr/gemini.ts` | Response parsing, error handling |
| `lib/auth/rbac.ts` | Role permission matrix — all 3 roles × all actions |

**Do not unit test**: Next.js components, API routes, Supabase calls, Elasticsearch queries

---

## 2. Integration Tests — `tests/integration/`
**Tool**: Vitest + real Supabase test project  
**What**: API routes with real DB, real auth  
**Target**: All critical API routes covered

| Route | Test cases |
|---|---|
| `POST /api/auth/login` | Valid creds, wrong password, inactive user |
| `POST /api/documents/upload` | Valid file, unsupported type, no auth, wrong role |
| `GET /api/documents` | Returns only dept docs for End User, all for Admin |
| `POST /api/chat` | Valid query returns citations, PII in input is masked, cached response returned on repeat |
| `GET /api/dashboard` | Admin gets all stats, Manager gets dept only, End User gets 403 |
| `POST /api/admin/users/invite` | Admin can invite, Manager gets 403 |

**Rules**:
- Use Supabase test project (separate from dev)
- Seed test data before each test suite, clean up after
- Never mock Supabase — test against real DB

---

## 3. E2E Tests — `tests/e2e/`
**Tool**: Playwright  
**What**: Key user flows in a real browser  
**Target**: 5 critical flows only (keep it fast)

| Flow | Steps |
|---|---|
| **Login** | Navigate to login → enter credentials → land on chat |
| **Chat with citation** | Send a question → receive streamed response → citation chip visible |
| **Document upload** | Go to documents → upload a PDF → indexing status shows Processing → Ready |
| **Role guard** | Log in as End User → try to access `/admin` → redirected |
| **New conversation** | Click "New Chat" → conversation cleared → can send new message |

**Do not E2E test**: Admin panel CRUD, dashboard charts, settings — cover with integration tests instead.

---

## Test Data

Seed files in `tests/fixtures/`:
- `hr_policy_sample.pdf` — 5-page HR policy doc (anonymized)
- `operations_sop_sample.pdf` — 3-page operations SOP
- `users.sql` — seed users for all 3 roles
- `documents.sql` — seed indexed documents

---

## CI Integration

Tests run in this order on every PR:
1. Unit tests (fast, < 30s)
2. Integration tests (needs Supabase test project env vars in CI secrets)
3. E2E tests (Playwright, runs against local Next.js dev server)

PR cannot merge if any layer fails.
