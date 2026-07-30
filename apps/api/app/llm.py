"""LLM access behind a small interface so the provider is a one-file swap.

Groq serves everything: llama-3.3-70b for drafting and judging, llama-3.1-8b
for cheap classification. The SDK retries rate limits; we retry invalid JSON.
"""

import json
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Protocol

from groq import BadRequestError, Groq

from app.config import get_settings


def draft_model() -> str:
    return get_settings().groq_draft_model


def classify_model() -> str:
    return get_settings().groq_classify_model


def judge_model() -> str:
    return get_settings().groq_judge_model


@dataclass(frozen=True)
class LLMResult:
    model: str
    prompt_tokens: int | None
    completion_tokens: int | None


class LLMProvider(Protocol):
    def complete_json(
        self,
        *,
        system: str,
        user: str,
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> tuple[dict[str, Any], LLMResult]: ...


class GroqProvider:
    def __init__(self) -> None:
        self._client = Groq(api_key=get_settings().groq_api_key, max_retries=5)

    def complete_json(
        self,
        *,
        system: str,
        user: str,
        model: str,
        temperature: float = 0.3,
        max_tokens: int = 1024,
    ) -> tuple[dict[str, Any], LLMResult]:
        # Reasoning models burn hidden thinking tokens from max_tokens and
        # add seconds of latency; low effort is plenty for structured replies.
        extra_body = {"reasoning_effort": "low"} if model.startswith("openai/gpt-oss") else {}
        last_error: Exception | None = None
        for _ in range(3):
            try:
                response = self._client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    response_format={"type": "json_object"},
                    temperature=temperature,
                    max_tokens=max_tokens,
                    extra_body=extra_body,
                )
            except BadRequestError as exc:
                # Groq validates json_object output server-side; a model that
                # rambled fails with json_validate_failed. Worth a re-roll.
                if "json_validate_failed" in str(exc):
                    last_error = exc
                    continue
                raise
            usage = response.usage
            result = LLMResult(
                model=model,
                prompt_tokens=usage.prompt_tokens if usage else None,
                completion_tokens=usage.completion_tokens if usage else None,
            )
            try:
                data = json.loads(response.choices[0].message.content or "")
                if isinstance(data, dict):
                    return data, result
                last_error = ValueError(f"expected object, got {type(data).__name__}")
            except json.JSONDecodeError as exc:
                last_error = exc
        raise RuntimeError(f"model kept returning invalid JSON: {last_error}")


@lru_cache
def get_llm() -> GroqProvider:
    return GroqProvider()
