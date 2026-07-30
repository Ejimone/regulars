"""Generate demo-business fixtures with Groq.

Produces, per business:
  fixtures/<slug>/business.json  — knowledge-base documents (hours, services,
                                   pricing, policies, faq, tone)
  fixtures/<slug>/messages.json  — ~40 inbound messages across six labeled
                                   categories, each wrapped in a payload shaped
                                   like the real channel API (Google Business
                                   Profile review / IG webhook / contact form)

The category label is fixture-level ground truth for the eval harness; the
payload is all a channel adapter is allowed to see. Fixtures are committed, so
this script only reruns when we want new demo businesses.

Run:  python -m scripts.generate_fixtures
"""

import json
import re
import sys
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from groq import Groq

from app.config import get_settings

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures"
MODEL = "llama-3.3-70b-versatile"

BUSINESSES = [
    {
        "slug": "brightside-dental",
        "name": "Brightside Dental Clinic",
        "vertical": "dental_clinic",
        "hint": (
            "A friendly two-dentist neighborhood clinic. Services: cleanings, fillings, "
            "whitening, crowns, emergency appointments. Takes several insurance plans. "
            "Closed Sundays. Warm, reassuring, professional tone."
        ),
    },
    {
        "slug": "nonna-rosa",
        "name": "Nonna Rosa Trattoria",
        "vertical": "restaurant",
        "hint": (
            "A family-run Italian trattoria. Dine-in, takeout, small catering. Fresh pasta, "
            "wood-fired pizza, weekend brunch. Takes reservations, has vegan and gluten-free "
            "options. Playful, warm, personal tone."
        ),
    },
]

# category -> (count, allowed channels, what the generator must produce)
CATEGORIES: dict[str, tuple[int, list[str], str]] = {
    "single_fact": (
        10,
        ["contact_form", "instagram_dm"],
        "A question answerable from exactly ONE fact in the knowledge base "
        "(an opening time, a price, whether something is offered). Vary phrasing and typos.",
    ),
    "multi_fact": (
        8,
        ["contact_form", "instagram_dm"],
        "A question that needs TWO OR MORE knowledge-base facts combined "
        "(e.g. availability on a specific day AND a price constraint).",
    ),
    "not_in_kb": (
        6,
        ["contact_form", "instagram_dm"],
        "A plausible, on-topic question whose answer is genuinely NOT in the knowledge base. "
        "It must sound completely reasonable for this business.",
    ),
    "angry_review": (
        6,
        ["google_review"],
        "An upset 1- or 2-star review about a specific bad experience (wait time, billing "
        "surprise, rude staff, wrong order...). Emotional but realistic, not cartoonish.",
    ),
    "vague": (
        5,
        ["instagram_dm"],
        "An extremely short or ambiguous message ('how much?', 'u open?', 'do you do the "
        "thing from the video?') that lacks the context needed to answer precisely.",
    ),
    "spam": (
        5,
        ["instagram_dm", "contact_form"],
        "Spam or an unsolicited sales pitch TO the business (SEO services, influencer collab "
        "offers, crypto, link-drop). Should clearly not deserve a customer-service reply.",
    ),
}


def _chat_json(client: Groq, prompt: str, temperature: float) -> dict[str, Any]:
    last_error: Exception | None = None
    for _ in range(3):
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=temperature,
            max_tokens=6000,
        )
        text = response.choices[0].message.content or ""
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                return data
            last_error = ValueError(f"expected JSON object, got {type(data).__name__}")
        except json.JSONDecodeError as exc:
            last_error = exc
    raise RuntimeError(f"model kept returning invalid JSON: {last_error}")


def _kb_problems(documents: list[dict[str, str]]) -> list[str]:
    """Reject thin knowledge bases — an unvalidated LLM writes the bare minimum."""
    problems = []
    kinds = sorted(d["kind"] for d in documents)
    if kinds != sorted(["hours", "services", "pricing", "policies", "faq", "tone"]):
        return [f"wrong kinds: {kinds}"]
    by_kind = {d["kind"]: d["content"] for d in documents}
    faq_pairs = len(re.findall(r"^Q:", by_kind["faq"], re.MULTILINE))
    if faq_pairs < 8:
        problems.append(f"faq has {faq_pairs} Q/A pairs, need at least 8")
    for kind in ("services", "pricing", "policies"):
        if len(by_kind[kind]) < 500:
            problems.append(f"{kind} is only {len(by_kind[kind])} chars, need at least 500")
        if by_kind[kind].count("## ") < 3:
            problems.append(f"{kind} needs at least 3 '## ' sections")
    for day in ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"):
        if day not in by_kind["hours"]:
            problems.append(f"hours must mention {day} explicitly")
    return problems


def generate_kb(client: Groq, biz: dict[str, str]) -> list[dict[str, str]]:
    prompt = f"""You are writing the internal knowledge base for a fictional small business.

Business: {biz["name"]} ({biz["vertical"]}). {biz["hint"]}

Return a JSON object: {{"documents": [{{"title": str, "kind": str, "content": str}}]}}

Produce EXACTLY six documents, one per kind: "hours", "services", "pricing", "policies",
"faq", "tone". This knowledge base is the ONLY source an AI assistant will have to answer
customers, so it must be rich and specific. Requirements:

- Facts must be concrete: exact times, exact USD prices, named services, named policies
  (cancellation windows, deposit amounts, insurance names, delivery radius...). Invent
  freely but stay internally consistent across documents.
- "services": at least 4 "## " sections, each describing a named offering in 2-3
  sentences (what it includes, how long it takes, who it's for). 600+ characters.
- "pricing": at least 3 "## " sections with itemized prices, ranges where honest,
  and any bundles/memberships. 500+ characters.
- "policies": at least 4 "## " sections (e.g. cancellation, payment/insurance,
  late arrival, refunds, accessibility). 500+ characters.
- "faq": EXACTLY 9 pairs formatted "Q: ...\\nA: ..." with ONE BLANK LINE between pairs.
  Specific, self-contained answers. Cover things NOT already obvious from other docs.
- "hours": one line per day for ALL SEVEN days (say "Closed" explicitly), plus holiday
  notes.
- "tone": a short voice guide — how this business talks to customers, 3 do's, 3 don'ts,
  and one example sign-off.

Blank line between "## " sections everywhere.
"""
    problems: list[str] = []
    for _ in range(3):
        documents = _chat_json(client, prompt, temperature=0.7)["documents"]
        problems = _kb_problems(documents)
        if not problems:
            return [
                {"title": d["title"], "kind": d["kind"], "content": d["content"]} for d in documents
            ]
        print(f"  regenerating knowledge base: {'; '.join(problems)}")
    raise RuntimeError(f"knowledge base still failing validation: {problems}")


def generate_messages(
    client: Groq, biz: dict[str, str], kb_text: str, category: str
) -> list[dict[str, Any]]:
    count, channels, instruction = CATEGORIES[category]
    prompt = f"""Business: {biz["name"]} ({biz["vertical"]}).

Its full knowledge base:
---
{kb_text}
---

Write EXACTLY {count} realistic inbound customer messages of this category:
{instruction}

Return a JSON object: {{"messages": [{{"author_name": str, "content": str,
"channel": str, "rating": int|null}}]}}

Rules:
- "channel" must be one of {channels}.
- "rating" is 1-5 and ONLY for google_review messages (null otherwise).
  {"Use only ratings 1 or 2." if category == "angry_review" else ""}
- Vary names (diverse, realistic), length, register, and typo frequency like real people.
- Instagram DMs are casual and short; contact-form messages a bit more formal;
  reviews read like reviews.
"""
    messages = _chat_json(client, prompt, temperature=0.9)["messages"]
    if len(messages) != count:
        print(f"  warning: asked {count} {category}, got {len(messages)} — keeping them")
    if not messages:
        raise RuntimeError(f"no messages generated for {category}")
    for m in messages:
        if m["channel"] not in channels:
            m["channel"] = channels[0]
        if m["channel"] != "google_review":
            m["rating"] = None
    return list(messages)


def wrap_payload(channel: str, item: dict[str, Any], received_at: datetime) -> dict[str, Any]:
    """Wrap generated text in a payload shaped like the real channel API —
    this is what makes the replay adapters honest."""
    iso = received_at.isoformat().replace("+00:00", "Z")
    if channel == "google_review":
        stars = ["ONE", "TWO", "THREE", "FOUR", "FIVE"]
        review_id = uuid.uuid4().hex
        return {
            "name": f"accounts/1001/locations/2002/reviews/{review_id}",
            "reviewId": review_id,
            "reviewer": {"displayName": item["author_name"], "isAnonymous": False},
            "starRating": stars[int(item["rating"]) - 1],
            "comment": item["content"],
            "createTime": iso,
            "updateTime": iso,
        }
    if channel == "instagram_dm":
        epoch_ms = int(received_at.timestamp() * 1000)
        ig_business_id = "17841400000000001"
        return {
            "object": "instagram",
            "entry": [
                {
                    "id": ig_business_id,
                    "time": epoch_ms,
                    "messaging": [
                        {
                            "sender": {"id": str(10**15 + uuid.uuid4().int % 10**14)},
                            "recipient": {"id": ig_business_id},
                            "timestamp": epoch_ms,
                            "message": {"mid": f"mid.{uuid.uuid4().hex}", "text": item["content"]},
                        }
                    ],
                }
            ],
        }
    email_name = item["author_name"].lower().replace(" ", ".")
    return {
        "form": "regulars-widget",
        "name": item["author_name"],
        "email": f"{email_name}@example.com",
        "message": item["content"],
        "submitted_at": iso,
    }


def external_id_of(channel: str, payload: dict[str, Any]) -> str:
    if channel == "google_review":
        return str(payload["reviewId"])
    if channel == "instagram_dm":
        return str(payload["entry"][0]["messaging"][0]["message"]["mid"])
    return uuid.uuid4().hex


def main() -> None:
    client = Groq(api_key=get_settings().groq_api_key)
    total = sum(count for count, _, _ in CATEGORIES.values())

    for biz in BUSINESSES:
        print(f"== {biz['name']}")
        out_dir = FIXTURES_DIR / biz["slug"]
        out_dir.mkdir(parents=True, exist_ok=True)

        print("  knowledge base...")
        documents = generate_kb(client, biz)
        business = {
            "slug": biz["slug"],
            "name": biz["name"],
            "vertical": biz["vertical"],
            "documents": documents,
        }
        (out_dir / "business.json").write_text(json.dumps(business, indent=2) + "\n")

        kb_text = "\n\n".join(f"[{d['kind']}] {d['title']}\n{d['content']}" for d in documents)
        collected: list[dict[str, Any]] = []
        for category in CATEGORIES:
            print(f"  messages: {category}...")
            collected += [
                {**m, "category": category}
                for m in generate_messages(client, biz, kb_text, category)
            ]

        # Spread received_at over the last 14 days, newest message first in the file
        now = datetime.now(UTC)
        step = timedelta(days=14) / max(len(collected), 1)
        fixture_messages = []
        for i, item in enumerate(collected):
            received_at = now - i * step
            payload = wrap_payload(item["channel"], item, received_at)
            fixture_messages.append(
                {
                    "external_id": external_id_of(item["channel"], payload),
                    "channel": item["channel"],
                    "category": item["category"],
                    "author_name": item["author_name"],
                    "content": item["content"],
                    "rating": item["rating"],
                    "received_at": received_at.isoformat(),
                    "payload": payload,
                }
            )
        (out_dir / "messages.json").write_text(json.dumps(fixture_messages, indent=2) + "\n")
        print(f"  wrote {len(documents)} documents, {len(fixture_messages)}/{total} messages")


if __name__ == "__main__":
    sys.exit(main())
