# Regulars

**Turn reviews and DMs into regulars.**

Small businesses get messages everywhere — Google reviews, Instagram DMs, contact forms — and every one deserves a fast, on-brand reply. Regulars pulls them into one inbox, drafts a reply grounded in the business's *actual* information (hours, services, pricing, policies) via lightweight RAG, and shows it in a dashboard for one-tap **approve / edit / send**. When it isn't confident in the facts, it says so and flags a human instead of guessing.

> **Status: M1 — data layer.** Milestones: ~~M0 scaffold~~ → ~~M1 data + seed~~ → M2 retrieval/draft pipeline + evals → M3 dashboard → M4 deploy + demo.

## Architecture

```
apps/web   Next.js 16 + Tailwind + shadcn/ui — inbox dashboard
apps/api   FastAPI — channel adapters, RAG pipeline, drafting, evals
db         Postgres + pgvector — tenants, knowledge chunks, messages, drafts
LLM        Groq (llama-3.3-70b for drafting, llama-3.1-8b for classification)
Embeddings bge-small-en-v1.5, computed locally via fastembed
```

Deliberate choices for this scale: a modular monolith (no microservices/queues — the ingest worker has a clean seam to split out if volume ever demands it), local CPU embeddings (a tenant's knowledge base is ~50–200 chunks), session-cookie auth only, and shadcn instead of a custom design system.

## Integrations — an honest table

| Channel | Mode | Why |
|---|---|---|
| Contact-form widget | **Live** | We host the endpoint; no approvals needed |
| Google reviews | Replay (fixtures shaped like the real API payload) | Google Business Profile API requires verified location ownership + quota approval |
| Instagram DMs | Replay (fixtures shaped like the real Graph API payload) | `instagram_manage_messages` requires Meta App Review |

Each channel implements the same `ChannelAdapter` interface — flipping replay → live is a config change plus credentials, not a rewrite.

## Run it

```bash
make setup   # creates .env — add your free GROQ_API_KEY from console.groq.com
make up      # db + api + web via docker compose
# web: http://localhost:3000   api: http://localhost:8000/docs
```

Native dev: `make dev-api` / `make dev-web` (with the compose `db` running). `make test`, `make lint`, `make eval`.
