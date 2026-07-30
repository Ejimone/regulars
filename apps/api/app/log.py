"""Structured JSON logging.

Every pipeline event logs one JSON line — tenant, decision, confidence,
latency, tokens, retrieved chunk ids. This is the raw material for every
metric we report, so it exists from day one and is never optional.
"""

import json
import logging
from typing import Any

logger = logging.getLogger("regulars")


def setup_logging() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")


def log_event(event: str, **fields: Any) -> None:
    logger.info(json.dumps({"event": event, **fields}, default=str))
