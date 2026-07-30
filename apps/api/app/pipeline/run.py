"""Pipeline orchestration: classify -> retrieve -> gate -> draft -> persist.

The decision logic itself is a pure function (`resolve_outcome`) so the
refusal paths are unit-testable without a database or a model.
"""

import re
import time
import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.channels import NormalizedMessage
from app.db.models import Document, Draft, Message, Tenant
from app.llm import LLMProvider
from app.log import log_event
from app.pipeline.classify import classify
from app.pipeline.draft import draft_refusal, draft_reply
from app.pipeline.retrieve import retrieve

# Below this best-match similarity, the KB almost certainly lacks the answer —
# refuse before spending a draft call. Tuned against the eval harness
# (0.60 falsely refused answerable questions at 0.59; not-in-KB sits lower).
CONFIDENCE_FLOOR = 0.58


def extract_cited_ns(reply: str, model_citations: object, fact_count: int) -> set[int]:
    """Which fact numbers did the draft actually use?

    Models are unreliable about the separate citations array but consistent
    about inline [n] markers (we prompt for them) — parse the text, union
    with whatever ints the array did contain, drop out-of-range numbers.
    """
    from_array = (
        {n for n in model_citations if isinstance(n, int)}
        if isinstance(model_citations, list)
        else set()
    )
    from_text = {int(n) for n in re.findall(r"\[(\d+)\]", reply)}
    return {n for n in (from_array | from_text) if 1 <= n <= fact_count}


@dataclass(frozen=True)
class Outcome:
    decision: str | None  # 'drafted' | 'refused' | None (spam: no draft at all)
    status: str  # message status: 'drafted' | 'flagged' | 'spam'


def resolve_outcome(label: str, confidence: float, can_answer: bool) -> Outcome:
    """label: 'reply' | 'spam' | 'escalate'. Pure — the whole refusal policy in one place.

    Escalations always get a draft (empathy needs no facts) but always land in
    the flagged queue: an angry customer is never auto-anything.
    """
    if label == "spam":
        return Outcome(decision=None, status="spam")
    if label == "escalate":
        return Outcome(decision="drafted", status="flagged")
    if confidence < CONFIDENCE_FLOOR or not can_answer:
        return Outcome(decision="refused", status="flagged")
    return Outcome(decision="drafted", status="drafted")


def _normalized(message: Message) -> NormalizedMessage:
    return NormalizedMessage(
        channel=message.channel,
        external_id=message.external_id,
        author_name=message.author_name,
        content=message.content,
        rating=message.rating,
        received_at=message.received_at,
        raw=message.raw,
    )


def process_message(session: Session, llm: LLMProvider, message: Message) -> Outcome:
    """Runs the full pipeline for one message and persists the result.
    Commits the session."""
    started = time.perf_counter()
    tenant = session.get_one(Tenant, message.tenant_id)
    tone = (
        session.scalar(
            select(Document.content).where(Document.tenant_id == tenant.id, Document.kind == "tone")
        )
        or ""
    )
    normalized = _normalized(message)

    label = classify(llm, normalized)

    if label == "spam":
        outcome = resolve_outcome(label, 0.0, False)
        message.status = outcome.status
        session.commit()
        log_event(
            "pipeline.spam", tenant=tenant.slug, message_id=message.id, channel=message.channel
        )
        return outcome

    retrieval = retrieve(session, tenant.id, message.content)
    escalation = label == "escalate"

    can_answer = False
    data: dict[str, object] = {}
    result = None
    # Escalations skip the gate; for replies, don't spend a draft call the gate will discard
    if escalation or retrieval.confidence >= CONFIDENCE_FLOOR:
        data, result = draft_reply(
            llm,
            business_name=tenant.name,
            vertical=tenant.vertical,
            tone=tone,
            message=normalized,
            chunks=retrieval.chunks,
            escalation=escalation,
        )
        can_answer = escalation or bool(data.get("can_answer"))

    outcome = resolve_outcome(label, retrieval.confidence, can_answer)

    if outcome.decision == "refused":
        data, result = draft_refusal(
            llm,
            business_name=tenant.name,
            vertical=tenant.vertical,
            tone=tone,
            message=normalized,
        )
        citations = []
    else:
        # Store the WHOLE retrieved set, flagging what the draft used: the UI
        # citations panel and the groundedness judge both need full context.
        cited_ns = extract_cited_ns(
            str(data.get("reply") or ""), data.get("citations"), len(retrieval.chunks)
        )
        citations = [
            {
                "n": i + 1,
                "chunk_id": str(chunk.id),
                "text": chunk.content,
                "cited": (i + 1) in cited_ns,
            }
            for i, chunk in enumerate(retrieval.chunks)
        ]

    latency_ms = int((time.perf_counter() - started) * 1000)
    assert result is not None and outcome.decision is not None
    draft = Draft(
        tenant_id=tenant.id,
        message_id=message.id,
        content=str(data.get("reply") or ""),
        decision=outcome.decision,
        citations=citations,
        confidence=retrieval.confidence,
        model=result.model,
        latency_ms=latency_ms,
        prompt_tokens=result.prompt_tokens,
        completion_tokens=result.completion_tokens,
    )
    session.add(draft)
    message.status = outcome.status
    session.commit()

    log_event(
        "pipeline.draft",
        tenant=tenant.slug,
        message_id=message.id,
        channel=message.channel,
        label=label,
        decision=outcome.decision,
        status=outcome.status,
        confidence=round(retrieval.confidence, 3),
        chunk_ids=[str(c.id) for c in retrieval.chunks],
        latency_ms=latency_ms,
        prompt_tokens=result.prompt_tokens,
        completion_tokens=result.completion_tokens,
    )
    return outcome


def process_new_messages(session: Session, llm: LLMProvider, tenant_id: uuid.UUID) -> int:
    messages = (
        session.scalars(
            select(Message)
            .where(Message.tenant_id == tenant_id, Message.status == "new")
            .order_by(Message.received_at)
        )
    ).all()
    for message in messages:
        process_message(session, llm, message)
    return len(messages)
