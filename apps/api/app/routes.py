"""HTTP surface. Demo-tenant model: no auth in the MVP — every route is
tenant-scoped by slug/id and the deployed instance serves fictional demo
businesses. Session-cookie auth is a deliberate post-MVP item (README)."""

import json
import time
import uuid
from collections.abc import Generator, Iterator
from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.channels import get_adapter
from app.db.models import Document, Draft, Edit, Message, Tenant
from app.db.session import get_sessionmaker
from app.llm import get_llm
from app.pipeline.run import process_message
from app.schemas import (
    CitationOut,
    ContactIn,
    ContactOut,
    DraftOut,
    MessageDetail,
    MessageListItem,
    ResetOut,
    SendIn,
    SendOut,
    TenantOut,
)

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


@router.get("/tenants")
def list_tenants(db: DbDep) -> list[TenantOut]:
    tenants = db.scalars(select(Tenant).order_by(Tenant.name)).all()
    return [TenantOut(slug=t.slug, name=t.name, vertical=t.vertical) for t in tenants]


@router.get("/tenants/{slug}/messages")
def list_messages(
    slug: str, db: DbDep, status: str | None = None
) -> list[MessageListItem]:
    tenant = _tenant_or_404(db, slug)
    query = (
        select(Message).where(Message.tenant_id == tenant.id).order_by(Message.received_at.desc())
    )
    if status:
        query = query.where(Message.status == status)
    messages = db.scalars(query).all()

    # latest draft decision per message, one query
    decisions: dict[uuid.UUID, str] = {}
    for draft in db.scalars(
        select(Draft)
        .where(Draft.message_id.in_([m.id for m in messages]))
        .order_by(Draft.created_at)
    ):
        decisions[draft.message_id] = draft.decision

    return [
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
    ]


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
def draft_message(message_id: uuid.UUID) -> StreamingResponse:
    """Runs the pipeline (if not yet run) and streams the draft as SSE.

    Streaming is presentation-layer: the pipeline produces the complete,
    validated, cited draft first (Groq is fast), then the text streams to the
    client in small deltas. Honest tradeoff, documented here: token-level
    passthrough streaming doesn't compose with JSON-validated output and the
    citation gate.
    """

    def gen() -> Iterator[str]:
        with get_sessionmaker()() as db:
            message = db.get(Message, message_id)
            if message is None:
                yield _sse("error", {"detail": "message not found"})
                return
            if message.status == "new":
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
def reset_demo(slug: str, db: DbDep) -> ResetOut:
    """One-click demo reset: rebuild this tenant from its committed fixtures."""
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
