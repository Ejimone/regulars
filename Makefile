.PHONY: setup up down dev-api dev-web test lint eval

setup: ## Copy .env.example to .env if missing
	@test -f .env || (cp .env.example .env && echo "Created .env — add your GROQ_API_KEY (console.groq.com)")

up: ## Run the full stack (db + api + web) in Docker
	docker compose up --build

down:
	docker compose down

dev-api: ## Run the API natively with reload (needs `make up` db or local postgres)
	cd apps/api && uvicorn app.main:app --reload --port 8000

dev-web: ## Run the web app natively
	cd apps/web && npm run dev

test:
	cd apps/api && python -m pytest

lint:
	cd apps/api && ruff check . && ruff format --check . && mypy
	cd apps/web && npm run lint && npm run typecheck

fixtures: ## Regenerate demo-business fixtures with Groq (fixtures are committed)
	cd apps/api && .venv/bin/python -m scripts.generate_fixtures

seed: ## Load fixtures into the database (computes embeddings locally)
	cd apps/api && .venv/bin/python -m scripts.seed

migrate: ## Apply database migrations
	cd apps/api && .venv/bin/alembic upgrade head

eval: ## Run the eval harness (lands in M2)
	@echo "eval harness arrives in M2"
