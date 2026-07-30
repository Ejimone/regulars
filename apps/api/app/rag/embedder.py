"""Embedding behind an interface so the provider is a one-file swap.

bge-* models embed queries and passages asymmetrically: queries get an
instruction prefix, passages don't. Callers must use the right method.
"""

from collections.abc import Sequence
from functools import lru_cache
from typing import Protocol

from app.db.models import EMBEDDING_DIM

_QUERY_PREFIX = "Represent this sentence for searching relevant passages: "


class Embedder(Protocol):
    dim: int

    def embed_passages(self, texts: Sequence[str]) -> list[list[float]]: ...

    def embed_query(self, text: str) -> list[float]: ...


class FastEmbedEmbedder:
    """Local CPU embeddings via fastembed. The model (~100MB) downloads on
    first use; a tenant's whole knowledge base embeds in seconds."""

    dim = EMBEDDING_DIM

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5") -> None:
        from fastembed import TextEmbedding  # deferred: import loads onnxruntime

        self._model = TextEmbedding(model_name)

    def embed_passages(self, texts: Sequence[str]) -> list[list[float]]:
        return [[float(x) for x in v] for v in self._model.embed(list(texts))]

    def embed_query(self, text: str) -> list[float]:
        return self.embed_passages([_QUERY_PREFIX + text])[0]


@lru_cache
def get_embedder() -> FastEmbedEmbedder:
    return FastEmbedEmbedder()
