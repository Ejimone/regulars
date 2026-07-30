"""Contact-form widget — the one genuinely live channel.

Payload shape: our own embeddable widget's POST body. The M3 API route
receives this exact shape and feeds it through this adapter, same as replay.
"""

from datetime import datetime
from typing import Any

from app.channels.base import NormalizedMessage


class ContactFormAdapter:
    channel = "contact_form"

    def parse(self, payload: dict[str, Any]) -> NormalizedMessage:
        return NormalizedMessage(
            channel=self.channel,
            external_id=None,  # forms have no upstream id; the row id is identity
            author_name=payload["name"],
            content=payload["message"],
            rating=None,
            received_at=datetime.fromisoformat(payload["submitted_at"].replace("Z", "+00:00")),
            raw=payload,
        )
