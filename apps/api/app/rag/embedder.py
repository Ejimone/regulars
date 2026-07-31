"""Embedding behind an interface so the provider is a one-file swap.

Two providers ship:

* ``jina``  — hosted HTTP embeddings, the deployment default. The local model
  drags in onnxruntime + numpy + weights (~150MB), which does not fit in a
  serverless bundle.
* ``local`` — fastembed on CPU. Costs nothing per call, so it stays the better
  choice for bulk re-seeding and for working offline.

Both are asymmetric: a query and a passage are embedded differently. bge does
that with an instruction prefix, Jina with a ``task`` parameter; this interface
hides which.
"""

from collections.abc import Sequence
from functools import lru_cache
from typing import Protocol

from app.config import get_settings
from app.db.models import EMBEDDING_DIM

_QUERY_PREFIX = "Represent this sentence for searching relevant passages: "
_JINA_URL = "https://api.jina.ai/v1/embeddings"


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


class JinaEmbedder:
    """Hosted embeddings via the Jina API.

    jina-embeddings-v3 is Matryoshka-trained, so asking for 384 dimensions
    returns a genuine 384-d vector rather than a lossy truncation. That keeps
    EMBEDDING_DIM and the existing pgvector column unchanged.
    """

    dim = EMBEDDING_DIM

    def __init__(self, api_key: str, model: str) -> None:
        if not api_key:
            raise RuntimeError(
                "EMBEDDING_PROVIDER is 'jina' but JINA_API_KEY is empty. Get a free "
                "key at https://jina.ai/embeddings/, or set EMBEDDING_PROVIDER=local "
                "to embed on CPU instead."
            )
        self._api_key = api_key
        self._model = model

    def _embed(self, texts: Sequence[str], task: str) -> list[list[float]]:
        import httpx

        response = httpx.post(
            _JINA_URL,
            headers={"Authorization": f"Bearer {self._api_key}"},
            json={
                "model": self._model,
                "task": task,
                "dimensions": self.dim,
                "input": list(texts),
            },
            timeout=30.0,
        )
        response.raise_for_status()
        # Items may come back out of order; `index` carries the true position.
        data = sorted(response.json()["data"], key=lambda item: item["index"])
        return [[float(x) for x in item["embedding"]] for item in data]

    def embed_passages(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []
        return self._embed(texts, "retrieval.passage")

    def embed_query(self, text: str) -> list[float]:
        return self._embed([text], "retrieval.query")[0]


@lru_cache
def get_embedder() -> Embedder:
    settings = get_settings()
    if settings.embedding_provider == "local":
        return FastEmbedEmbedder()
    return JinaEmbedder(settings.jina_api_key, settings.jina_embed_model)
