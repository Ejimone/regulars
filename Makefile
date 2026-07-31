.PHONY: setup up down dev-api dev-web test lint eval

setup: ## Copy .env.example to .env if missing
	@test -f .env || (cp .env.example .env && echo "Created .env — add your GROQ_API_KEY (console.groq.com)")

up: ## Run the full stack (db + api + web) in Docker
	docker compose up --build

down:
	docker compose down

dev-api: ## Run the API natively with reload (needs `make up` db or local postgres)
	cd apps/api && uvicorn app.main:app --reload --port 8001

dev-web: ## Run the web app natively
	cd apps/web && pnpm dev

test:
	cd apps/api && python -m pytest

lint:
	cd apps/api && ruff check . && ruff format --check . && mypy
	cd apps/web && npm run lint && npm run typecheck

fixtures: ## DESTRUCTIVE — regenerate sample fixtures with Groq, discarding the hand-edited ones
	cd apps/api && .venv/bin/python -m scripts.generate_fixtures --force

seed: ## Load fixtures into the database (computes embeddings locally)
	cd apps/api && .venv/bin/python -m scripts.seed

migrate: ## Apply database migrations
	cd apps/api && .venv/bin/alembic upgrade head

draft: ## Run the pipeline over all unprocessed messages
	cd apps/api && .venv/bin/python -m scripts.draft_all

eval: ## Reseed, run the pipeline on all fixture messages, score it
	cd apps/api && .venv/bin/python -m evals.run
