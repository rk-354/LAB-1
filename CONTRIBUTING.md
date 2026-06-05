# Contributing to RefinerIQ

## Branching Strategy

```
main (production)
  └── staging
        └── develop
              ├── feature/RIQ-<issue>-short-description
              ├── bugfix/RIQ-<issue>-short-description
              └── hotfix/RIQ-<issue>-short-description
```

## Workflow

1. Create a branch from `develop`: `git checkout -b feature/RIQ-42-add-ocr-pipeline`
2. Write code + tests
3. Ensure tests pass: `pytest tests/unit`
4. Submit PR against `develop`
5. PR requires: CI passing + 1 reviewer approval
6. Squash-merge into `develop`
7. Periodically: `develop` → `staging` (integration testing) → `main` (production)

## Commit Message Format

```
<type>(<scope>): <short summary>

Types: feat | fix | refactor | test | docs | chore | ci
Examples:
  feat(agents): add HR agent with leave policy retrieval
  fix(rag): correct chunk overlap causing duplicate citations
  test(api): add unit tests for PII detection middleware
```

## Code Standards

- **Python**: ruff (lint) + mypy (types) + pytest
- **TypeScript**: eslint + tsc
- No `print()` — use structured logger
- All LLM calls through `LLMRouter`
- Pydantic models for all API request/response schemas

## Security Requirements

- Never commit `.env` or secrets
- Run `safety check` before PR if adding Python deps
- PII handling: review any code touching user input
