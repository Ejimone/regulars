"""The refusal policy and RRF merge are pure functions — tested without a
database or a model in the room."""

import uuid

from app.pipeline.retrieve import rrf_merge
from app.pipeline.run import CONFIDENCE_FLOOR, extract_cited_ns, resolve_outcome


def test_spam_gets_no_draft() -> None:
    outcome = resolve_outcome("spam", 0.0, False)
    assert outcome.decision is None
    assert outcome.status == "spam"


def test_escalation_is_always_drafted_and_always_flagged() -> None:
    # even with zero retrieval confidence — empathy needs no facts
    outcome = resolve_outcome("escalate", 0.0, False)
    assert outcome.decision == "drafted"
    assert outcome.status == "flagged"


def test_low_confidence_refuses() -> None:
    outcome = resolve_outcome("reply", CONFIDENCE_FLOOR - 0.01, True)
    assert outcome.decision == "refused"
    assert outcome.status == "flagged"


def test_model_admitting_ignorance_refuses_even_with_confident_retrieval() -> None:
    outcome = resolve_outcome("reply", 0.99, False)
    assert outcome.decision == "refused"
    assert outcome.status == "flagged"


def test_confident_and_answerable_drafts() -> None:
    outcome = resolve_outcome("reply", CONFIDENCE_FLOOR + 0.1, True)
    assert outcome.decision == "drafted"
    assert outcome.status == "drafted"


def test_rrf_prefers_items_ranked_by_both_lists() -> None:
    a, b, c, d = (uuid.uuid4() for _ in range(4))
    merged = rrf_merge([[a, b, c], [b, d]])
    assert merged[0] == b  # in both rankings
    assert set(merged) == {a, b, c, d}


def test_rrf_empty_rankings() -> None:
    assert rrf_merge([[], []]) == []


def test_cited_ns_parsed_from_inline_markers_when_array_is_useless() -> None:
    # models write [n] inline reliably but often return a junk citations array
    reply = "We open at 8am [1] and a cleaning is $120 [3]."
    assert extract_cited_ns(reply, [], 4) == {1, 3}
    assert extract_cited_ns(reply, None, 4) == {1, 3}
    assert extract_cited_ns(reply, ["2"], 4) == {1, 3}  # stringly-typed array ignored


def test_cited_ns_unions_array_and_drops_out_of_range() -> None:
    reply = "See [2]. Also [9] is nonsense."
    assert extract_cited_ns(reply, [1], 4) == {1, 2}  # 9 out of range, dropped
