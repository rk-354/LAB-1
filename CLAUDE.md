# RefinerIQ — Claude Code Rules

## Stack
- **Framework**: Next.js 14 (App Router), TypeScript strict
- **Auth + DB + Storage**: Supabase (PostgreSQL + pgvector + Auth + Storage)
- **LLMs**: Ollama llama3.2:3b (primary) → Anthropic Claude (fallback)
- **OCR**: Gemini API — only in `lib/rag/extractor.ts`
- **Embeddings**: Ollama nomic-embed-text (768-dim) — only in `lib/llm/embeddings.ts`
- **Search**: Elasticsearch (Docker) — keyword search
- **Email**: Resend via Supabase Auth

## Project Structure
```
services/frontend/
  app/
    (protected routes — middleware guards all)
    login/          # Login page
    api/            # All backend logic lives here
      auth/         # Magic link + callback
      chat/         # RAG chat + sessions
      documents/    # Upload + ingest pipeline
      dashboard/    # Stats
      admin/        # User management
  components/       # UI components
  lib/
    supabase/       # client.ts, server.ts, admin.ts
    llm/            # router.ts, embeddings.ts, pii.ts
    rag/            # chunker.ts, extractor.ts, retrieval.ts
    env.ts          # Zod-validated env vars
  middleware.ts     # Auth guard
```

## Code Rules

### Always
- TypeScript strict — no `any`
- Zod for all API request/response validation
- All LLM calls through `lib/llm/router.ts` — never call Ollama or Anthropic SDK directly
- All Supabase calls use the correct client: `createServerClient` in API routes, `createBrowserClient` in components
- Return `{ data, error }` shape from all API routes
- Every AI response must include citations array
- PII scan on every user message before LLM — call `lib/llm/pii.ts`
- Use structured logging (no `console.log` or `console.error` in production)

### Never
- Never commit `.env.local` — env vars are in `.env.local` only
- Never call LLMs directly — always use `lib/llm/router.ts`
- Never skip RBAC checks — every protected route calls auth check
- Never use `any` type — use `unknown` and narrow it

### API Route Pattern
```ts
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  const body = MySchema.parse(await req.json())
  // ... logic
  return NextResponse.json({ data: result, error: null })
}
```

## Git Rules
- Branch from `develop`: `feature/short-name`, `bugfix/short-name`
- Commit format: `feat(chat): add citation chips to AI responses`
- Types: `feat` `fix` `refactor` `test` `docs` `chore` `ci`
- PR targets `develop` — never push directly to `main` or `staging`
