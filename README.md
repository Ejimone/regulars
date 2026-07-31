# Regulars

**Turn reviews and DMs into regulars.**

Small businesses get messages everywhere — Google reviews, Instagram DMs, contact forms — and every one deserves a fast, on-brand reply. Regulars pulls them into one inbox, drafts a reply grounded in the business's *actual* information (hours, services, pricing, policies) via lightweight RAG, and shows it in a dashboard for one-tap **approve / edit / send**. When it isn't confident in the facts, it says so and flags a human instead of guessing.

> **Status: M3 — dashboard.** Milestones: ~~M0 scaffold~~ → ~~M1 data + seed~~ → ~~M2 retrieval/draft pipeline + evals~~ → ~~M3 dashboard~~ → M4 deploy + demo.

## Architecture

```
apps/web   Next.js 16 + Tailwind + shadcn/ui — inbox dashboard
apps/api   FastAPI — channel adapters, RAG pipeline, drafting, evals
db         Postgres + pgvector — tenants, knowledge chunks, messages, drafts
LLM        Groq — one model per stage, each in its own free-tier rate-limit
           bucket: gpt-oss-120b drafts, llama-3.1-8b classifies, and
           llama-3.3-70b judges evals (different family than the drafter,
           so the groundedness judge can't grade its own homework)
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

## How a draft happens

```
message → classify (spam? angry? 8B model + rating rule)
        → hybrid retrieve (pgvector cosine ⊕ Postgres FTS, RRF-merged)
        → confidence gate (weak best-match ⇒ refuse before drafting)
        → draft (70B, tone-guided, cites facts inline as [n], may admit it can't answer)
        → approve / edit / send  (every edit stored as training signal)
```

Refusal is a feature: when the knowledge base can't support an answer, the system
drafts a warm "let me check and get back to you" — generated with *no facts in the
prompt*, so it physically cannot hallucinate one — and flags a human.

## Evals

`make eval` reseeds, runs the pipeline over every fixture message (each labeled
single-fact / multi-fact / not-in-KB / angry-review / vague / spam), and scores:
groundedness (LLM-judged against cited facts), refusal recall on not-in-KB questions,
false-refusal rate, spam precision/recall, escalation rate for angry reviews, and
latency percentiles. The same harness runs in CI on every push to main with the score
table in the job summary.

## Run it

```bash
make setup   # creates .env — add your free GROQ_API_KEY from console.groq.com
make up      # db + api + web via docker compose
# web: http://localhost:3000   api: http://localhost:8001/docs
```

Native dev: `make dev-api` / `make dev-web` (with the compose `db` running). `make test`, `make lint`, `make eval`.
