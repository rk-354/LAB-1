# RefinerIQ — Refinery Intelligence Platform

A multi-agent AI platform for refinery operations, document management, HR, and operational intelligence.

## Overview

RefinerIQ is a tech capability demo showcasing enterprise-grade AI infrastructure for the oil & gas refinery domain. It features a conversational AI interface powered by a multi-agent RAG architecture, supporting documents, operations data, HR workflows, and cross-departmental intelligence.

## Key Capabilities

| Capability | Technology |
|---|---|
| Frontend + API | Next.js 14 (App Router), TypeScript |
| Auth | Supabase Auth + Resend (magic link) |
| Database | Supabase PostgreSQL + pgvector |
| File Storage | Supabase Storage |
| Vector Search | Supabase pgvector (nomic-embed-text 768-dim) |
| Keyword Search | Elasticsearch (Docker) |
| Local LLM | Ollama — llama3.2:3b |
| Cloud LLM | Anthropic Claude (fallback) |
| OCR | Gemini API (scanned docs) |
| Embeddings | Ollama nomic-embed-text |
| CI/CD | GitHub Actions |
| Deployment | Cloudflare Pages (frontend) |

## Environments

| Environment | Branch | Purpose |
|---|---|---|
| Development | `develop` | Local development |
| Staging | `staging` | Integration testing |
| Production | `main` | Demo / production |

## Project Structure

```
refinery-intelligence-platform/
├── .github/              # CI/CD workflows, issue templates
├── docs/                 # PRD, architecture, design docs
├── services/
│   └── frontend/         # Next.js 14 app (UI + all API routes)
│       ├── app/api/      # Backend API routes
│       ├── components/   # UI components
│       └── lib/          # Supabase, LLM, RAG utilities
├── supabase/             # DB migrations + seed data
├── infrastructure/       # Docker compose (Elasticsearch)
└── tests/                # Unit, integration, e2e
```

## Quick Start

```bash
cp .env.example .env
# Fill in .env values
docker-compose up -d
```

## Documentation

- [Product Requirements Document](docs/PRD.md)
- [Architecture Design](docs/architecture/ARCHITECTURE.md)
- [Database Design](docs/database/DATABASE.md)
- [API Reference](docs/api/API.md)
- [Contributing Guide](CONTRIBUTING.md)

## Branching Strategy

```
main (production)
  └── staging
        └── develop
              ├── feature/xxx
              ├── bugfix/xxx
              └── hotfix/xxx
```

## Bug Reporting

Use [GitHub Issues](../../issues) with the provided bug report template.
