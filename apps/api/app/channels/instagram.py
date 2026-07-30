"""Instagram DMs.

Payload shape: a Meta webhook delivery for the `instagram` object (messaging
entry). Live mode needs an IG professional account and App Review for
`instagram_manage_messages`, so this adapter runs in replay. The webhook
only carries the sender's IGSID — resolving a display name is a separate
Graph API call in live mode, hence the placeholder here.
"""

from datetime import UTC, datetime
from typing import Any

from app.channels.base import NormalizedMessage


class InstagramAdapter:
    channel = "instagram_dm"

    def parse(self, payload: dict[str, Any]) -> NormalizedMessage:
        event = payload["entry"][0]["messaging"][0]
        sender_id = event["sender"]["id"]
        return NormalizedMessage(
            channel=self.channel,
            external_id=event["message"]["mid"],
            author_name=f"Instagram user •{sender_id[-4:]}",
            content=event["message"]["text"],
            rating=None,
            received_at=datetime.fromtimestamp(event["timestamp"] / 1000, tz=UTC),
            raw=payload,
        )
