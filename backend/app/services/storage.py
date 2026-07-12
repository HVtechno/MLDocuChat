"""Supabase Storage helpers for the PDF files themselves.

Files live in a private bucket, namespaced by user id so paths are
unique and easy to clean up. The vector data lives in Postgres; the
original PDF lives here in case we ever need to re-process or let the
user download it.

Storage object keys must use a safe character set — accented or
non-ASCII filenames (e.g. "Čestné prohlášení.pdf") produce an
InvalidKey error. We sanitize the filename for the KEY only; the
original filename is still stored in the database for display.
"""
import re
import unicodedata
import uuid

from app.config import get_settings
from app.core.supabase_client import get_supabase

_settings = get_settings()
_BUCKET = _settings.supabase_storage_bucket


def _safe_name(filename: str) -> str:
    """Reduce a filename to storage-safe ASCII.

    - transliterates accented chars to ASCII (Čestné -> Cestne)
    - replaces anything not [A-Za-z0-9._-] with an underscore
    - guards against empty results
    """
    # decompose accents then drop combining marks
    normalized = unicodedata.normalize("NFKD", filename)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    # keep a safe set; collapse the rest to underscores
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", ascii_only).strip("._")
    if not cleaned:
        cleaned = "document"
    return cleaned


_CONTENT_TYPES = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".csv": "text/csv",
    ".txt": "text/plain",
    ".md": "text/markdown",
}


def upload_pdf(user_id: str, filename: str, file_bytes: bytes) -> str:
    """Upload a document and return its storage path. The stored key uses
    a sanitized filename (preserving the real extension); the original
    name is kept by the caller for the database record. (Name kept as
    upload_pdf for compatibility, but handles all supported formats.)"""
    supabase = get_supabase()
    safe = _safe_name(filename)
    ext = ""
    dot = filename.lower().rfind(".")
    if dot != -1:
        ext = filename.lower()[dot:]
    content_type = _CONTENT_TYPES.get(ext, "application/octet-stream")
    # Unique path avoids collisions if two files share a name.
    path = f"{user_id}/{uuid.uuid4()}-{safe}"
    supabase.storage.from_(_BUCKET).upload(
        path,
        file_bytes,
        {"content-type": content_type},
    )
    return path


def delete_pdf(storage_path: str) -> None:
    """Remove a stored PDF (best-effort; ignores if already gone)."""
    supabase = get_supabase()
    try:
        supabase.storage.from_(_BUCKET).remove([storage_path])
    except Exception:
        pass
