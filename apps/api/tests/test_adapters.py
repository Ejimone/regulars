from datetime import UTC, datetime

from app.channels import get_adapter


def test_google_review_parse() -> None:
    payload = {
        "name": "accounts/1001/locations/2002/reviews/abc123",
        "reviewId": "abc123",
        "reviewer": {"displayName": "Dana Whitfield", "isAnonymous": False},
        "starRating": "TWO",
        "comment": "Waited 90 minutes.",
        "createTime": "2026-07-20T14:30:00Z",
        "updateTime": "2026-07-20T14:30:00Z",
    }
    m = get_adapter("google_review").parse(payload)
    assert m.external_id == "abc123"
    assert m.author_name == "Dana Whitfield"
    assert m.rating == 2
    assert m.content == "Waited 90 minutes."
    assert m.received_at == datetime(2026, 7, 20, 14, 30, tzinfo=UTC)


def test_instagram_dm_parse() -> None:
    payload = {
        "object": "instagram",
        "entry": [
            {
                "id": "17841400000000001",
                "time": 1753000000000,
                "messaging": [
                    {
                        "sender": {"id": "1000000000012345"},
                        "recipient": {"id": "17841400000000001"},
                        "timestamp": 1753000000000,
                        "message": {"mid": "mid.deadbeef", "text": "u open?"},
                    }
                ],
            }
        ],
    }
    m = get_adapter("instagram_dm").parse(payload)
    assert m.external_id == "mid.deadbeef"
    assert m.author_name == "Instagram user •2345"  # webhook has no display name
    assert m.rating is None
    assert m.content == "u open?"
    assert m.received_at.tzinfo is not None


def test_contact_form_parse() -> None:
    payload = {
        "form": "regulars-widget",
        "name": "Sam Okafor",
        "email": "sam.okafor@example.com",
        "message": "Do you have parking?",
        "submitted_at": "2026-07-22T09:15:00Z",
    }
    m = get_adapter("contact_form").parse(payload)
    assert m.external_id is None
    assert m.author_name == "Sam Okafor"
    assert m.content == "Do you have parking?"
