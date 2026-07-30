"""API response/request models — this is the typed boundary. The frontend's
TypeScript types are generated from the OpenAPI schema these produce, so
field names and optionality here ARE the contract."""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class TenantOut(BaseModel):
    slug: str
    name: str
    vertical: str


class CitationOut(BaseModel):
    n: int
    chunk_id: str
    text: str
    cited: bool


class DraftOut(BaseModel):
    id: uuid.UUID
    content: str
    decision: str  # 'drafted' | 'refused'
    confidence: float
    citations: list[CitationOut]
    model: str
    latency_ms: int
    created_at: datetime


class MessageListItem(BaseModel):
    id: uuid.UUID
    channel: str
    author_name: str
    preview: str
    rating: int | None
    status: str
    received_at: datetime
    decision: str | None  # latest draft's decision, if any


class MessageDetail(BaseModel):
    id: uuid.UUID
    channel: str
    author_name: str
    content: str
    rating: int | None
    status: str
    received_at: datetime
    draft: DraftOut | None


class SendIn(BaseModel):
    final_content: str = Field(min_length=1)


class SendOut(BaseModel):
    ok: bool
    was_modified: bool


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    message: str = Field(min_length=1, max_length=4000)


class ContactOut(BaseModel):
    ok: bool
    message_id: uuid.UUID


class ResetOut(BaseModel):
    ok: bool
    documents: int
    messages: int
