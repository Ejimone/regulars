"""Message triage: reply / spam / escalate.

Deterministic rule first — a 1-2 star review is always an escalation, no
model needed. The only judgment call left (is this spam?) goes to the cheap
fast model.
"""

from app.channels import NormalizedMessage
from app.llm import LLMProvider, classify_model

_SYSTEM = """You screen the inbox of a small local business.

Spam is mail sent AT the business, not from customers: unsolicited pitches for SEO,
marketing, or web services; influencer "collab" offers; crypto; link-drops; lead-gen
bots. A real customer asking about products, prices, hours, bookings, or complaining
is NEVER spam, however short or badly written.

Return JSON: {"is_spam": true|false}"""


def classify(llm: LLMProvider, message: NormalizedMessage) -> str:
    if message.rating is not None and message.rating <= 2:
        return "escalate"
    data, _ = llm.complete_json(
        system=_SYSTEM,
        user=f"Channel: {message.channel}\nMessage: {message.content}",
        model=classify_model(),
        temperature=0.0,
        max_tokens=50,
    )
    return "spam" if data.get("is_spam") else "reply"
