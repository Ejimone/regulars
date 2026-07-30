"""Application settings.

Every value comes from the environment (or a local .env file). All fields
without defaults are required: the app refuses to boot if one is missing,
so misconfiguration fails loudly at startup instead of quietly at runtime.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Postgres DSN, e.g. postgresql+psycopg://regulars:regulars@localhost:5432/regulars
    database_url: str = Field(min_length=1)

    # GroqCloud API key (console.groq.com)
    groq_api_key: str = Field(min_length=1)

    # Origin allowed to call this API from the browser
    web_origin: str = "http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]  # fields are populated from the environment
