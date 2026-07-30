"""Database models.

Every table is tenant-scoped: tenant_id appears on all of them so no query can
accidentally cross businesses. Enum-ish columns are plain strings guarded by
CHECK constraints (Postgres enums make migrations painful for no MVP benefit).
"""

import uuid
from datetime import datetime
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    CheckConstraint,
    Computed,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, TSVECTOR
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# BAAI/bge-small-en-v1.5
EMBEDDING_DIM = 384

DOCUMENT_KINDS = ("hours", "services", "pricing", "policies", "faq", "tone")
CHANNELS = ("contact_form", "google_review", "instagram_dm")
MESSAGE_STATUSES = ("new", "drafted", "flagged", "sent", "spam")
DRAFT_DECISIONS = ("drafted", "refused")


def _in(column: str, values: tuple[str, ...]) -> str:
    quoted = ", ".join(f"'{v}'" for v in values)
    return f"{column} IN ({quoted})"


class Base(DeclarativeBase):
    pass


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(64), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    vertical: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Document(Base):
    """One source document of business knowledge (hours, an FAQ page, ...)."""

    __tablename__ = "documents"
    __table_args__ = (CheckConstraint(_in("kind", DOCUMENT_KINDS), name="documents_kind"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    kind: Mapped[str] = mapped_column(String(32))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Chunk(Base):
    """Retrieval unit: a semantically whole slice of a document, embedded and
    full-text indexed (hybrid search reads both columns)."""

    __tablename__ = "chunks"
    __table_args__ = (Index("ix_chunks_tsv", "tsv", postgresql_using="gin"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    position: Mapped[int]
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIM))
    tsv: Mapped[str] = mapped_column(
        TSVECTOR, Computed("to_tsvector('english', content)", persisted=True)
    )


class Message(Base):
    """An inbound item from any channel. `raw` holds the original payload
    exactly as the adapter received it."""

    __tablename__ = "messages"
    __table_args__ = (
        CheckConstraint(_in("channel", CHANNELS), name="messages_channel"),
        CheckConstraint(_in("status", MESSAGE_STATUSES), name="messages_status"),
        UniqueConstraint("tenant_id", "channel", "external_id"),
        Index("ix_messages_tenant_status", "tenant_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True
    )
    channel: Mapped[str] = mapped_column(String(32))
    external_id: Mapped[str | None] = mapped_column(String(200))
    author_name: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    rating: Mapped[int | None]  # 1–5, reviews only
    status: Mapped[str] = mapped_column(String(16), default="new", server_default="new")
    raw: Mapped[dict[str, Any]] = mapped_column(JSONB)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Draft(Base):
    """One generated reply attempt, with everything needed to audit it later:
    what was retrieved, how confident we were, what it cost."""

    __tablename__ = "drafts"
    __table_args__ = (CheckConstraint(_in("decision", DRAFT_DECISIONS), name="drafts_decision"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True
    )
    message_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("messages.id", ondelete="CASCADE"), index=True
    )
    content: Mapped[str] = mapped_column(Text)
    decision: Mapped[str] = mapped_column(String(16))
    citations: Mapped[list[dict[str, Any]]] = mapped_column(JSONB)  # [{chunk_id, quote}]
    confidence: Mapped[float]
    model: Mapped[str] = mapped_column(String(100))
    latency_ms: Mapped[int]
    prompt_tokens: Mapped[int | None]
    completion_tokens: Mapped[int | None]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Edit(Base):
    """The human outcome for a draft: what was actually sent. (draft, final)
    pairs are the training signal for the voice feedback loop."""

    __tablename__ = "edits"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True
    )
    draft_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("drafts.id", ondelete="CASCADE"), unique=True
    )
    final_content: Mapped[str] = mapped_column(Text)
    was_modified: Mapped[bool]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
