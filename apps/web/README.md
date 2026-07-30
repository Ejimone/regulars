# Regulars — web

The dashboard for Regulars: a unified inbox where AI-drafted replies to
reviews, DMs, and contact-form messages are reviewed, edited, and sent.
Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui (base-nova on
Base UI) · Phosphor icons · TanStack Query.

## Develop

```bash
pnpm install
pnpm dev            # http://localhost:3000 (expects the API on :8000)
```

Run the API alongside it from the repo root with `make dev-api` (see the root
README for database setup and seeding).

## API types

The typed client is generated from the running API's OpenAPI schema:

```bash
pnpm generate:api   # regenerates src/lib/api/schema.d.ts from localhost:8000
```

Regenerate and commit `schema.d.ts` whenever the API contract changes — CI
does not regenerate it.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```
