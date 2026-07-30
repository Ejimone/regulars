"""Re-indexing: the single path that turns a document's content into chunks.

Used by seeding (bulk) and by the knowledge-base edit endpoint (single doc).
Deleting and rebuilding a document's chunks keeps position/content/embedding
consistent in one place.
"""

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.db.models import Chunk, Document
from app.rag.chunking import chunk_document
from app.rag.embedder import get_embedder


def index_document(session: Session, document: Document) -> int:
    """Replace a document's chunks: re-chunk, re-embed, insert. Returns the
    chunk count. Flushes but does not commit — the caller owns the transaction."""
    session.execute(delete(Chunk).where(Chunk.document_id == document.id))

    texts = chunk_document(document.content, kind=document.kind)
    embeddings = get_embedder().embed_passages(texts)
    for position, (text, embedding) in enumerate(zip(texts, embeddings, strict=True)):
        session.add(
            Chunk(
                tenant_id=document.tenant_id,
                document_id=document.id,
                position=position,
                content=text,
                embedding=embedding,
            )
        )
    session.flush()
    return len(texts)
