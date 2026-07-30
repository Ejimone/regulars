"""Drafting: turn a message + retrieved facts into an on-brand reply.

Two prompts, one contract: the model may only use facts from the FACTS
block, must cite them inline as [n], and must admit when the facts don't
cover the question (can_answer=false) — the second refusal signal after the
retrieval-confidence gate. The refusal prompt gets NO facts at all, so a
refusal draft physically cannot hallucinate one.
"""

from typing import Any

from app.channels import NormalizedMessage
from app.llm import LLMProvider, LLMResult, draft_model
from app.pipeline.retrieve import RetrievedChunk

# Free-tier token budgets are per-day; don't spend them on chunk tails
_FACT_CHARS = 800

_REGISTER = {
    "instagram_dm": "a casual, friendly DM (contractions fine, no email sign-offs)",
    "google_review": "a public review response: professional, gracious, addressed to the "
    "reviewer but readable by every future customer",
    "contact_form": "a short, warm email reply",
}

_DRAFT_SYSTEM = """You draft replies on behalf of {name}, a {vertical}.

Voice guide for this business:
{tone}

Rules:
- Use ONLY facts stated in the FACTS block. Never invent or embellish hours, prices,
  availability, services, or policies — not even plausible ones.
- Cite every fact you use: put its bracket number, like [2], immediately after the claim.
- If the FACTS block does not contain what is needed to answer, set "can_answer" to false
  and leave "reply" empty.
- 2-5 sentences, written as {register}.
- Never mention being an AI, "the facts", or internal notes.
{escalation}
Return JSON: {{"can_answer": true|false, "reply": str, "citations": [int, ...]}}"""

_ESCALATION_EXTRA = """- This customer is upset. Lead with a specific, sincere apology.
  No excuses, no policy-quoting at them. Offer to make it right and invite them to
  contact the business directly."""

_REFUSAL_SYSTEM = """You draft replies on behalf of {name}, a {vertical}.

Voice guide for this business:
{tone}

The business needs to double-check before answering this message. Write a warm 1-2
sentence acknowledgment in the business's voice — thank them, say you'll confirm and get
back to them shortly. State NO facts: no hours, prices, or availability. Written as
{register}. Never mention being an AI.

Return JSON: {{"reply": str}}"""


def _facts_block(chunks: list[RetrievedChunk]) -> str:
    return "\n\n".join(f"[{i + 1}] {chunk.content[:_FACT_CHARS]}" for i, chunk in enumerate(chunks))


def _message_block(message: NormalizedMessage) -> str:
    rating = f" ({message.rating} stars)" if message.rating is not None else ""
    return (
        f"Channel: {message.channel}{rating}\n"
        f"From: {message.author_name}\n"
        f"Message:\n{message.content}"
    )


def draft_reply(
    llm: LLMProvider,
    *,
    business_name: str,
    vertical: str,
    tone: str,
    message: NormalizedMessage,
    chunks: list[RetrievedChunk],
    escalation: bool,
) -> tuple[dict[str, Any], LLMResult]:
    system = _DRAFT_SYSTEM.format(
        name=business_name,
        vertical=vertical.replace("_", " "),
        tone=tone,
        register=_REGISTER[message.channel],
        escalation=_ESCALATION_EXTRA + "\n" if escalation else "",
    )
    user = f"FACTS:\n{_facts_block(chunks)}\n\n{_message_block(message)}"
    # generous cap: reasoning models (gpt-oss) think in hidden tokens first
    return llm.complete_json(
        system=system, user=user, model=draft_model(), temperature=0.4, max_tokens=2000
    )


def draft_refusal(
    llm: LLMProvider,
    *,
    business_name: str,
    vertical: str,
    tone: str,
    message: NormalizedMessage,
) -> tuple[dict[str, Any], LLMResult]:
    system = _REFUSAL_SYSTEM.format(
        name=business_name,
        vertical=vertical.replace("_", " "),
        tone=tone,
        register=_REGISTER[message.channel],
    )
    return llm.complete_json(
        system=system,
        user=_message_block(message),
        model=draft_model(),
        temperature=0.4,
        max_tokens=1000,
    )
