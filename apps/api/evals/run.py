"""Eval harness: reseed, run the pipeline over every fixture message, score it.

Ground truth is the fixture category label (which never enters the pipeline).
Metrics:
  groundedness    — LLM judge: is every factual claim in a drafted answer
                    supported by its cited facts? (single_fact + multi_fact)
  refusal recall  — not_in_kb messages that were refused instead of answered
  false refusals  — answerable messages (single/multi) that were refused
  spam            — precision/recall of the spam gate
  escalation      — angry reviews that landed in the flagged queue
  latency/tokens  — p50/p95 from the drafts table

Run:  python -m evals.run          (assumes migrated db + GROQ_API_KEY)
Writes a markdown report to $GITHUB_STEP_SUMMARY when set (CI).
"""

import argparse
import json
import os
import sys
from pathlib import Path
from statistics import median, quantiles
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Draft, Message, Tenant
from app.db.session import get_sessionmaker
from app.llm import LLMProvider, get_llm, judge_model
from app.log import setup_logging
from app.pipeline.run import process_new_messages
from scripts.seed import FIXTURES_DIR
from scripts.seed import main as seed_main

_JUDGE_SYSTEM = """You are auditing an AI-drafted customer reply for factual grounding.

You get FACTS (the only source material allowed) and a REPLY. A reply is grounded when
every specific factual claim in it — hours, prices, services, policies, availability —
appears in the FACTS. Pleasantries, apologies, and offers to help are not factual claims.

Be strict: a plausible-sounding price or time that is NOT in the FACTS makes the reply
ungrounded.

Return JSON: {"grounded": true|false, "ungrounded_claims": [str, ...]}"""


def _ground_truth() -> dict[tuple[str, str], str]:
    """(tenant_slug, message content) -> fixture category."""
    truth: dict[tuple[str, str], str] = {}
    for business_dir in sorted(FIXTURES_DIR.iterdir()):
        messages_file = business_dir / "messages.json"
        if not messages_file.exists():
            continue
        for m in json.loads(messages_file.read_text()):
            truth[(business_dir.name, m["content"])] = m["category"]
    return truth


def _judge_grounded(llm: LLMProvider, draft: Draft) -> bool:
    # Judge against everything retrieval put in front of the drafter — using a
    # retrieved-but-uncited fact is a citation gap, not a hallucination.
    facts = "\n\n".join(f"[{c['n']}] {c['text']}" for c in draft.citations)
    data, _ = llm.complete_json(
        system=_JUDGE_SYSTEM,
        user=f"FACTS:\n{facts or '(none retrieved)'}\n\nREPLY:\n{draft.content}",
        model=judge_model(),
        temperature=0.0,
        # generous: reasoning models (gpt-oss) spend hidden thinking tokens
        # from this budget before any JSON appears
        max_tokens=2000,
    )
    return bool(data.get("grounded"))


def _pct(numerator: int, denominator: int) -> str:
    return (
        f"{100 * numerator / denominator:.0f}% ({numerator}/{denominator})"
        if denominator
        else "n/a"
    )


def _collect(session: Session) -> list[dict[str, Any]]:
    truth = _ground_truth()
    rows: list[dict[str, Any]] = []
    for tenant in session.scalars(select(Tenant)).all():
        for message in session.scalars(select(Message).where(Message.tenant_id == tenant.id)).all():
            draft = session.scalar(select(Draft).where(Draft.message_id == message.id))
            category = truth.get((tenant.slug, message.content))
            if category is None:
                continue  # content edited by hand or duplicate — skip, don't guess
            rows.append({"category": category, "status": message.status, "draft": draft})
    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--keep",
        action="store_true",
        help="skip reseeding: score the current db state (finishes any unprocessed "
        "messages) instead of a fresh pipeline run — saves the day's token budget",
    )
    args = parser.parse_args()

    setup_logging()
    if not args.keep:
        seed_main()
    llm = get_llm()

    with get_sessionmaker()() as session:
        for tenant in session.scalars(select(Tenant)).all():
            count = process_new_messages(session, llm, tenant.id)
            print(f"processed {count} messages for {tenant.slug}")
        rows = _collect(session)

        answerable = [r for r in rows if r["category"] in ("single_fact", "multi_fact")]
        drafted_answers = [r for r in answerable if r["draft"] and r["draft"].decision == "drafted"]
        judged = sum(_judge_grounded(llm, r["draft"]) for r in drafted_answers)

        not_in_kb = [r for r in rows if r["category"] == "not_in_kb"]
        refused_nik = sum(1 for r in not_in_kb if r["draft"] and r["draft"].decision == "refused")
        false_refusals = sum(
            1 for r in answerable if r["draft"] and r["draft"].decision == "refused"
        )

        spam = [r for r in rows if r["category"] == "spam"]
        spam_caught = sum(1 for r in spam if r["status"] == "spam")
        nonspam = [r for r in rows if r["category"] != "spam"]
        spam_false_positives = sum(1 for r in nonspam if r["status"] == "spam")

        angry = [r for r in rows if r["category"] == "angry_review"]
        angry_flagged = sum(1 for r in angry if r["status"] == "flagged")

        latencies = sorted(d.latency_ms for d in session.scalars(select(Draft)).all())
        p50 = int(median(latencies)) if latencies else 0
        p95 = (
            int(quantiles(latencies, n=20)[-1])
            if len(latencies) >= 20
            else (latencies[-1] if latencies else 0)
        )

    lines = [
        "| Metric | Score |",
        "|---|---|",
        f"| Groundedness (drafted answers, LLM-judged) | {_pct(judged, len(drafted_answers))} |",
        f"| Refusal recall (not-in-KB refused) | {_pct(refused_nik, len(not_in_kb))} |",
        f"| False refusals (answerable refused) | {_pct(false_refusals, len(answerable))} |",
        f"| Spam recall | {_pct(spam_caught, len(spam))} |",
        f"| Spam false positives | {_pct(spam_false_positives, len(nonspam))} |",
        f"| Angry reviews flagged for human | {_pct(angry_flagged, len(angry))} |",
        f"| Draft latency p50 / p95 | {p50}ms / {p95}ms |",
        f"| Cases evaluated | {len(rows)} |",
    ]
    report = "\n".join(lines)
    print("\n## Regulars eval report\n\n" + report)

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        Path(summary_path).write_text("## Regulars eval report\n\n" + report + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
