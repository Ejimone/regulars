"""Google Business Profile reviews.

Payload shape: a review resource from
GET accounts/{a}/locations/{l}/reviews (Business Profile API). Live mode
needs verified location ownership + API quota approval, so this adapter runs
in replay; the parsing below is exactly what live mode would use.
"""

from datetime import datetime
from typing import Any

from app.channels.base import NormalizedMessage

_STARS = {"ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5}


class GoogleReviewsAdapter:
    channel = "google_review"

    def parse(self, payload: dict[str, Any]) -> NormalizedMessage:
        return NormalizedMessage(
            channel=self.channel,
            external_id=payload["reviewId"],
            author_name=payload["reviewer"]["displayName"],
            content=payload.get("comment", ""),
            rating=_STARS[payload["starRating"]],
            received_at=datetime.fromisoformat(payload["createTime"].replace("Z", "+00:00")),
            raw=payload,
        )
