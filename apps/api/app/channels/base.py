"""The channel seam.

Every source of inbound messages implements ChannelAdapter: parse a raw
payload (webhook body, API response item, form POST) into one normalized
shape. Replay mode and live mode differ only in where payloads come from —
the parsing, and everything downstream, is identical. That is the honest
claim behind "flipping a channel live is a config change".
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Protocol


@dataclass(frozen=True)
class NormalizedMessage:
    channel: str
    external_id: str | None
    author_name: str
    content: str
    rating: int | None  # 1-5, reviews only
    received_at: datetime
    raw: dict[str, Any]


class ChannelAdapter(Protocol):
    channel: str

    def parse(self, payload: dict[str, Any]) -> NormalizedMessage: ...
