# RefinerIQ — Claude Code Rules

## Stack
- **Frontend + API**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **API routes**: `app/api/**` — handle all backend logic
- **Auth**: Supabase Auth (never roll custom auth)
- **DB**: Supabase PostgreSQL + pgvector
- **Storage**: Supabase Storage
- **Search**: Elasticsearch (Docker)
- **LLMs**: Ollama (primary) → Anthropic (fallback). Route via `lib/llm/router.ts` only
- **OCR**: Gemini API — only in `lib/ocr/gemini.ts`
- **Email**: Resend — only for auth flows

## Project Structure
```
app/
  (auth)/         # login, reset-password pages
  (app)/          # protected routes
    chat/
    documents/
    dashboard/
    admin/
  api/
    chat/
    documents/
    users/
    auth/
lib/
  llm/            # LLM router, prompt templates
  rag/            # retrieval, chunking, embedding
  ocr/            # Gemini OCR
  pii/            # PII detection + masking
  supabase/       # client, server, admin clients
  elasticsearch/  # ES client + index helpers
components/
  ui/             # design system primitives
  chat/
  documents/
  dashboard/
  admin/
types/
tests/
  unit/
  integration/
  e2e/
```

## Code Rules

### Always
- TypeScript strict mode — no `any`
- Zod for all API request/response validation
- All LLM calls through `lib/llm/router.ts` — never call Ollama or Anthropic SDK directly in a component or route
- All Supabase calls use the correct client: `createServerClient` in API routes, `createBrowserClient` in components
- Return `{ data, error }` shape from all API routes
- Every AI response must include citations array — never return an answer without sources
- PII scan on every user message before it reaches the LLM — call `lib/pii/scan.ts`

### Never
- No `console.log` in production code — use the structured logger (`lib/logger.ts`)
- No hardcoded API keys, model names, or URLs — use `env.ts` (typed env validation)
- No direct DB queries outside `lib/supabase/` — use typed query helpers
- No skipping RBAC checks in API routes — every protected route calls `requireRole()`
- No `any` type — use `unknown` and narrow it

### API Route Pattern
```ts
// Every API route follows this shape
export async function POST(req: Request) {
  const session = await requireSession()          // throws 401 if not authed
  const role = await requireRole(session, ['admin', 'manager'])  // throws 403
  const body = MySchema.parse(await req.json())   // throws 400 on bad input
  // ... logic
  return Response.json({ data: result, error: null })
}
```

## LLM Router Rules
- Primary: Ollama llama3.2:3b (local Docker)
- Fallback: Anthropic Claude (if Ollama unavailable or `complexity === 'high'`)
- Cache key: `hash(model + prompt)` — check Redis/in-memory cache before calling
- Log every LLM call: model, input tokens, output tokens, latency, cached (bool)

## RAG Rules
- Chunk size: 512 tokens, 50 token overlap
- Embeddings: Ollama `nomic-embed-text`
- Retrieval: pgvector semantic search + Elasticsearch BM25 → RRF merge → top 5 chunks
- Every retrieved chunk must carry: `doc_id`, `filename`, `page_number`, `chunk_index`
- Citations format: `{ source: filename, page: N, chunkId: string }`

## Testing Rules
- Unit tests: `tests/unit/` — test pure functions, lib utilities
- Integration tests: `tests/integration/` — test API routes with real Supabase (test project)
- E2E tests: `tests/e2e/` — Playwright, test key user flows only (login, chat, upload)
- Coverage target: 70% minimum
- Never mock Supabase in integration tests — use the test project

## Git Rules
- Branch from `develop`: `feature/short-name`, `bugfix/short-name`, `hotfix/short-name`
- Commit format: `feat(chat): add citation chips to AI responses`
- Types: `feat` `fix` `refactor` `test` `docs` `chore` `ci`
- PR requires CI passing before merge
- Never push directly to `main` or `staging`

## Environment Files
- `.env.example` — template, committed
- `.env.local` — actual values, never committed
- All env vars typed and validated in `lib/env.ts` using Zod
