"""Request/response shapes for chat endpoints."""
from datetime import datetime
from pydantic import BaseModel


class AskRequest(BaseModel):
    question: str
    chat_id: str | None = None            # continue an existing chat, or None for new
    document_ids: list[str] | None = None  # optionally scope to specific docs
    tone: str | None = None                # professional | casual | humorous
    language: str | None = None            # e.g. "Hindi", "Tamil"; None = English/auto


class ChatOut(BaseModel):
    id: str
    title: str
    created_at: datetime


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    citations: list | None = None
    created_at: datetime
