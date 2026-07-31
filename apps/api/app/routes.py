"""HTTP surface. No auth in the MVP — every route is tenant-scoped by slug/id,
and workspaces backed by committed fixtures are flagged `is_sample` so the UI
can label them. Session-cookie auth is a deliberate post-MVP item (README)."""

import json
import logging
import time
import uuid
from collections.abc import Generator, Iterator
from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.channels import get_adapter
from app.db.models import (
    CHANNELS,
    MESSAGE_STATUSES,
    Chunk,
    Document,
    Draft,
    Edit,
    Message,
    Tenant,
)
from app.db.session import get_sessionmaker
from app.llm import get_llm
from app.pipeline.run import process_message
from app.rag.indexing import index_document
from app.schemas import (
    CitationOut,
    ContactIn,
    ContactOut,
    DocumentOut,
    DocumentUpdateIn,
    DraftOut,
    MessageDetail,
    MessageListItem,
    MessageListPage,
    ResetOut,
    SendIn,
    SendOut,
    StatsOut,
    TenantOut,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")


def get_db() -> Generator[Session, None, None]:
    session = get_sessionmaker()()
    try:
        yield session
    finally:
        session.close()


DbDep = Annotated[Session, Depends(get_db)]


def _tenant_or_404(db: Session, slug: str) -> Tenant:
    tenant = db.scalar(select(Tenant).where(Tenant.slug == slug))
    if tenant is None:
        raise HTTPException(404, f"unknown tenant: {slug}")
    return tenant


def _latest_draft(db: Session, message_id: uuid.UUID) -> Draft | None:
    return db.scalar(
        select(Draft)
        .where(Draft.message_id == message_id)
        .order_by(Draft.created_at.desc())
        .limit(1)
    )


def _draft_out(draft: Draft) -> DraftOut:
    return DraftOut(
        id=draft.id,
        content=draft.content,
        decision=draft.decision,
        confidence=draft.confidence,
        citations=[CitationOut(**c) for c in draft.citations],
        model=draft.model,
        latency_ms=draft.latency_ms,
        created_at=draft.created_at,
    )


def _is_sample(slug: str) -> bool:
    """A workspace is sample content when committed fixtures back it — the same
    condition reset_tenant requires to rebuild one."""
    from scripts.seed import FIXTURES_DIR  # scripts import app, not vice versa

    return (FIXTURES_DIR / slug / "business.json").exists()


@router.get("/tenants")
def list_tenants(db: DbDep) -> list[TenantOut]:
    tenants = db.scalars(select(Tenant).order_by(Tenant.name)).all()
    return [
        TenantOut(slug=t.slug, name=t.name, vertical=t.vertical, is_sample=_is_sample(t.slug))
        for t in tenants
    ]


@router.get("/tenants/{slug}/messages")
def list_messages(
    slug: str,
    db: DbDep,
    status: str | None = None,
    q: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> MessageListPage:
    tenant = _tenant_or_404(db, slug)
    limit = min(max(limit, 1), 100)
    offset = max(offset, 0)

    filters = [Message.tenant_id == tenant.id]
    if status:
        filters.append(Message.status == status)
    if q:
        like = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        pattern = f"%{like}%"
        filters.append(or_(Message.author_name.ilike(pattern), Message.content.ilike(pattern)))

    total = db.scalar(select(func.count()).select_from(Message).where(*filters)) or 0
    messages = db.scalars(
        select(Message)
        .where(*filters)
        .order_by(Message.received_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    # latest draft decision per message, one query
    decisions: dict[uuid.UUID, str] = {}
    for draft in db.scalars(
        select(Draft)
        .where(Draft.message_id.in_([m.id for m in messages]))
        .order_by(Draft.created_at)
    ):
        decisions[draft.message_id] = draft.decision

    return MessageListPage(
        items=[
            MessageListItem(
                id=m.id,
                channel=m.channel,
                author_name=m.author_name,
                preview=m.content[:120],
                rating=m.rating,
                status=m.status,
                received_at=m.received_at,
                decision=decisions.get(m.id),
            )
            for m in messages
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/tenants/{slug}/stats")
def tenant_stats(slug: str, db: DbDep) -> StatsOut:
    tenant = _tenant_or_404(db, slug)

    by_status = dict.fromkeys(MESSAGE_STATUSES, 0)
    for status, count in db.execute(
        select(Message.status, func.count())
        .where(Message.tenant_id == tenant.id)
        .group_by(Message.status)
    ):
        by_status[status] = count

    by_channel = dict.fromkeys(CHANNELS, 0)
    for channel, count in db.execute(
        select(Message.channel, func.count())
        .where(Message.tenant_id == tenant.id)
        .group_by(Message.channel)
    ):
        by_channel[channel] = count

    # regenerate appends drafts, so decisions count the latest draft per message
    latest = (
        select(Draft.message_id, func.max(Draft.created_at).label("mc"))
        .where(Draft.tenant_id == tenant.id)
        .group_by(Draft.message_id)
        .subquery()
    )
    decisions: dict[str, int] = {}
    for decision, count in db.execute(
        select(Draft.decision, func.count())
        .join(
            latest,
            (Draft.message_id == latest.c.message_id) & (Draft.created_at == latest.c.mc),
        )
        .where(Draft.tenant_id == tenant.id)
        .group_by(Draft.decision)
    ):
        decisions[decision] = count

    avg_latency, avg_confidence = db.execute(
        select(func.avg(Draft.latency_ms), func.avg(Draft.confidence)).where(
            Draft.tenant_id == tenant.id
        )
    ).one()

    sends, edited_sends = db.execute(
        select(func.count(), func.count().filter(Edit.was_modified)).where(
            Edit.tenant_id == tenant.id
        )
    ).one()

    return StatsOut(
        messages_total=sum(by_status.values()),
        by_status=by_status,
        by_channel=by_channel,
        drafted=decisions.get("drafted", 0),
        refused=decisions.get("refused", 0),
        avg_latency_ms=round(avg_latency) if avg_latency is not None else None,
        avg_confidence=round(float(avg_confidence), 3) if avg_confidence is not None else None,
        sends=sends,
        edited_sends=edited_sends,
        edit_rate=round(edited_sends / sends, 3) if sends else None,
    )


def _document_out(document: Document, chunk_count: int) -> DocumentOut:
    return DocumentOut(
        id=document.id,
        title=document.title,
        kind=document.kind,
        content=document.content,
        chunk_count=chunk_count,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


@router.get("/tenants/{slug}/documents")
def list_documents(slug: str, db: DbDep) -> list[DocumentOut]:
    tenant = _tenant_or_404(db, slug)
    documents = db.scalars(
        select(Document)
        .where(Document.tenant_id == tenant.id)
        .order_by(Document.kind, Document.title)
    ).all()
    chunk_counts: dict[uuid.UUID, int] = {}
    for document_id, count in db.execute(
        select(Chunk.document_id, func.count())
        .where(Chunk.tenant_id == tenant.id)
        .group_by(Chunk.document_id)
    ):
        chunk_counts[document_id] = count
    return [_document_out(d, chunk_counts.get(d.id, 0)) for d in documents]


@router.put("/documents/{document_id}")
def update_document(document_id: uuid.UUID, body: DocumentUpdateIn, db: DbDep) -> DocumentOut:
    """Edit a knowledge-base document and re-index it (re-chunk + re-embed)
    synchronously, so a successful response means retrieval sees the new text."""
    document = db.get(Document, document_id)
    if document is None:
        raise HTTPException(404, "document not found")
    document.content = body.content
    chunk_count = index_document(db, document)
    db.commit()
    db.refresh(document)
    return _document_out(document, chunk_count)


@router.get("/messages/{message_id}")
def get_message(message_id: uuid.UUID, db: DbDep) -> MessageDetail:
    message = db.get(Message, message_id)
    if message is None:
        raise HTTPException(404, "message not found")
    draft = _latest_draft(db, message.id)
    return MessageDetail(
        id=message.id,
        channel=message.channel,
        author_name=message.author_name,
        content=message.content,
        rating=message.rating,
        status=message.status,
        received_at=message.received_at,
        draft=_draft_out(draft) if draft else None,
    )


def _sse(event: str, data: Any) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"


@router.post("/messages/{message_id}/draft")
def draft_message(message_id: uuid.UUID, force: bool = False) -> StreamingResponse:
    """Runs the pipeline (if not yet run) and streams the draft as SSE.

    `force=true` regenerates: it re-runs the pipeline on an already-drafted
    message, appending a new drafts row (the old one stays for the audit
    trail). Restricted to drafted/flagged so a sent message can't be un-sent.

    Streaming is presentation-layer: the pipeline produces the complete,
    validated, cited draft first (Groq is fast), then the text streams to the
    client in small deltas. Honest tradeoff, documented here: token-level
    passthrough streaming doesn't compose with JSON-validated output and the
    citation gate.
    """

    def _draft_events(message_id: uuid.UUID, force: bool) -> Iterator[str]:
        with get_sessionmaker()() as db:
            message = db.get(Message, message_id)
            if message is None:
                yield _sse("error", {"detail": "message not found"})
                return
            if message.status == "new" or (force and message.status in ("drafted", "flagged")):
                yield _sse("status", {"stage": "drafting"})
                process_message(db, get_llm(), message)
            if message.status == "spam":
                yield _sse("meta", {"status": "spam", "decision": None, "confidence": 0})
                yield _sse("done", {})
                return
            draft = _latest_draft(db, message.id)
            if draft is None:
                yield _sse("error", {"detail": "no draft produced"})
                return
            yield _sse(
                "meta",
                {
                    "status": message.status,
                    "decision": draft.decision,
                    "confidence": round(draft.confidence, 3),
                },
            )
            words = draft.content.split(" ")
            for i in range(0, len(words), 3):
                yield _sse("delta", {"text": " ".join(words[i : i + 3]) + " "})
                time.sleep(0.024)
            yield _sse("citations", draft.citations)
            yield _sse("done", {"draft_id": str(draft.id), "content": draft.content})

    def gen() -> Iterator[str]:
        # Headers and the first event are already on the wire by the time the
        # pipeline runs, so an exception here would otherwise just truncate the
        # stream and leave the client spinning. Emit a terminal error event
        # instead — the UI listens for it.
        try:
            yield from _draft_events(message_id, force)
        except Exception as exc:  # noqa: BLE001 - the client needs a reason, whatever it is
            logger.exception("draft failed for message %s", message_id)
            yield _sse("error", {"detail": f"{type(exc).__name__}: {exc}"})

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/drafts/{draft_id}/send")
def send_draft(draft_id: uuid.UUID, body: SendIn, db: DbDep) -> SendOut:
    draft = db.get(Draft, draft_id)
    if draft is None:
        raise HTTPException(404, "draft not found")
    message = db.get(Message, draft.message_id)
    assert message is not None
    was_modified = body.final_content.strip() != draft.content.strip()

    existing = db.scalar(select(Edit).where(Edit.draft_id == draft.id))
    if existing:
        existing.final_content = body.final_content
        existing.was_modified = was_modified
    else:
        db.add(
            Edit(
                tenant_id=draft.tenant_id,
                draft_id=draft.id,
                final_content=body.final_content,
                was_modified=was_modified,
            )
        )
    # Replay channels have no outbound API — "send" marks the human decision,
    # which is the part the product owns. Live-channel send lands with live mode.
    message.status = "sent"
    db.commit()
    return SendOut(ok=True, was_modified=was_modified)


@router.post("/tenants/{slug}/reset")
def reset_tenant(slug: str, db: DbDep) -> ResetOut:
    """Rebuild this tenant from its committed source fixtures."""
    from scripts.seed import FIXTURES_DIR, seed_business  # scripts import app, not vice versa

    _tenant_or_404(db, slug)
    business_dir = FIXTURES_DIR / slug
    if not (business_dir / "business.json").exists():
        raise HTTPException(404, f"no fixtures for tenant: {slug}")
    seed_business(business_dir)

    tenant = _tenant_or_404(db, slug)  # re-read: reset replaced the tenant row
    documents = db.scalar(
        select(func.count()).select_from(Document).where(Document.tenant_id == tenant.id)
    )
    messages = db.scalar(
        select(func.count()).select_from(Message).where(Message.tenant_id == tenant.id)
    )
    return ResetOut(ok=True, documents=documents or 0, messages=messages or 0)


@router.post("/public/contact/{slug}")
def contact_intake(slug: str, body: ContactIn, db: DbDep) -> ContactOut:
    """The live channel: the public contact form posts here, and the payload
    goes through the same adapter as replayed fixtures."""
    tenant = _tenant_or_404(db, slug)
    payload = {
        "form": "regulars-widget",
        "name": body.name,
        "email": body.email,
        "message": body.message,
        "submitted_at": datetime.now(UTC).isoformat(),
    }
    normalized = get_adapter("contact_form").parse(payload)
    message = Message(
        tenant_id=tenant.id,
        channel=normalized.channel,
        external_id=normalized.external_id,
        author_name=normalized.author_name,
        content=normalized.content,
        rating=normalized.rating,
        raw=normalized.raw,
        received_at=normalized.received_at,
    )
    db.add(message)
    db.commit()
    return ContactOut(ok=True, message_id=message.id)
