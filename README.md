# RefinerIQ — Refinery Intelligence Platform

A multi-agent AI platform for refinery operations, document management, HR, and operational intelligence.

## Overview

RefinerIQ is a tech capability demo showcasing enterprise-grade AI infrastructure for the oil & gas refinery domain. It features a conversational AI interface powered by a multi-agent RAG architecture, supporting documents, operations data, HR workflows, and cross-departmental intelligence.

## Key Capabilities

| Capability | Technology |
|---|---|
| Multi-Agent Orchestration | LangGraph |
| RAG Pipeline | LangChain + ChromaDB |
| Local LLM | Ollama (Llama 3.2, Mistral) |
| 3rd Party LLMs | OpenAI, Anthropic, Groq |
| OCR | Tesseract / PaddleOCR |
| SQL Database | PostgreSQL |
| Vector Database | ChromaDB |
| Search | Elasticsearch |
| File Storage | MinIO |
| Caching | Redis |
| PII Protection | Microsoft Presidio |
| Frontend | Next.js 14 |
| Backend | FastAPI (Python) |
| CI/CD | GitHub Actions |
| Logging | Structured JSON + Sentry |

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
├── docs/                 # PRD, architecture, database, design docs
├── services/
│   ├── api/              # FastAPI backend
│   ├── frontend/         # Next.js chatbot UI
│   ├── agents/           # Multi-agent system (LangGraph)
│   ├── ingestion/        # Document ingestion pipeline
│   └── ocr/              # OCR microservice
├── infrastructure/
│   ├── docker/           # Dockerfiles
│   └── environments/     # Per-env configs
├── tests/                # Unit, integration, e2e
└── scripts/              # Dev utilities
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
