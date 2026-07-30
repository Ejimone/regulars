"""Application settings.

Every value comes from the environment (or a local .env file). All fields
without defaults are required: the app refuses to boot if one is missing,
so misconfiguration fails loudly at startup instead of quietly at runtime.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# The .env lives at the repo root; scripts and alembic run from apps/api, the
# API itself may run from the root. In containers neither file exists and
# values come from real environment variables (which always take precedence).
_REPO_ROOT_ENV = Path(__file__).resolve().parent.parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(_REPO_ROOT_ENV, ".env"), extra="ignore")

    # Postgres DSN, e.g. postgresql+psycopg://regulars:regulars@localhost:5432/regulars
    database_url: str = Field(min_length=1)

    # GroqCloud API key (console.groq.com)
    groq_api_key: str = Field(min_length=1)

    # Origin allowed to call this API from the browser
    web_origin: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]  # fields are populated from the environment
