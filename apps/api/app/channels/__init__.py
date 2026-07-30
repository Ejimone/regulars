from app.channels.base import ChannelAdapter, NormalizedMessage
from app.channels.contact_form import ContactFormAdapter
from app.channels.google_reviews import GoogleReviewsAdapter
from app.channels.instagram import InstagramAdapter

_ADAPTERS: dict[str, ChannelAdapter] = {
    adapter.channel: adapter
    for adapter in (GoogleReviewsAdapter(), InstagramAdapter(), ContactFormAdapter())
}


def get_adapter(channel: str) -> ChannelAdapter:
    return _ADAPTERS[channel]


__all__ = ["ChannelAdapter", "NormalizedMessage", "get_adapter"]
