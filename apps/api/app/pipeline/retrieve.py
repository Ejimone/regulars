"""Hybrid retrieval: vector + full-text, merged with Reciprocal Rank Fusion.

Pure vector search whiffs on proper nouns, prices, and day names in a small
corpus; full-text whiffs on paraphrase. Each produces a ranking, RRF merges
them, and the best vector similarity doubles as the pipeline's confidence
signal (a weak best-match means the knowledge base likely lacks the answer).
"""

import uuid
from dataclasses import dataclass

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.db.models import Chunk
from app.rag.embedder import get_embedder

VECTOR_POOL = 8
FTS_POOL = 8
RRF_K = 60


@dataclass(frozen=True)
class RetrievedChunk:
    id: uuid.UUID
    content: str
    similarity: float  # cosine similarity to the query (0 for FTS-only hits)


@dataclass(frozen=True)
class RetrievalResult:
    chunks: list[RetrievedChunk]
    confidence: float  # best vector similarity across the corpus for this query


def rrf_merge(rankings: list[list[uuid.UUID]], k: int = RRF_K) -> list[uuid.UUID]:
    """Merge rankings by summed reciprocal rank. Pure, order-stable, tested."""
    scores: dict[uuid.UUID, float] = {}
    for ranking in rankings:
        for rank, item in enumerate(ranking):
            scores[item] = scores.get(item, 0.0) + 1.0 / (k + rank + 1)
    return sorted(scores, key=lambda item: -scores[item])


def retrieve(session: Session, tenant_id: uuid.UUID, query: str, top_k: int = 4) -> RetrievalResult:
    query_vector = get_embedder().embed_query(query)

    distance = Chunk.embedding.cosine_distance(query_vector).label("distance")
    vector_rows = session.execute(
        select(Chunk.id, Chunk.content, distance)
        .where(Chunk.tenant_id == tenant_id)
        .order_by(distance)
        .limit(VECTOR_POOL)
    ).all()

    ts_query = func.plainto_tsquery("english", query)
    fts_rows = session.execute(
        select(Chunk.id, Chunk.content)
        .where(Chunk.tenant_id == tenant_id, Chunk.tsv.op("@@")(ts_query))
        .order_by(text("ts_rank(tsv, plainto_tsquery('english', :q)) DESC"))
        .params(q=query)
        .limit(FTS_POOL)
    ).all()

    similarity = {row.id: 1.0 - float(row.distance) for row in vector_rows}
    content = {row.id: row.content for row in vector_rows} | {
        row.id: row.content for row in fts_rows
    }

    merged = rrf_merge([[row.id for row in vector_rows], [row.id for row in fts_rows]])
    chunks = [
        RetrievedChunk(
            id=chunk_id, content=content[chunk_id], similarity=similarity.get(chunk_id, 0.0)
        )
        for chunk_id in merged[:top_k]
    ]
    confidence = max(similarity.values(), default=0.0)
    return RetrievalResult(chunks=chunks, confidence=confidence)
