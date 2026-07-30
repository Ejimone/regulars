"""Test environment: required settings are stubbed before the app imports."""

import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("GROQ_API_KEY", "test-key")
