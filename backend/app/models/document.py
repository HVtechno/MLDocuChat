"""Request/response shapes for document endpoints."""
from datetime import datetime
from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: str
    filename: str
    page_count: int | None = None
    status: str
    created_at: datetime


class UploadResult(BaseModel):
    document: DocumentOut
    chunks_created: int
