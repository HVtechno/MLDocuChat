"""Ingestion pipeline: PDF bytes -> stored, searchable chunks.

Pipeline stages:
  1. extract   — pull text per page (PyMuPDF), keeping page numbers so
                 citations can point at the source page later.
  2. chunk     — split each page's text into overlapping chunks, tagging
                 every chunk with the page it came from.
  3. embed     — vectorize all chunks in batches (OpenAI).
  4. store     — write the document row + chunk rows (with embeddings)
                 into Supabase.

Everything is scoped to a user_id, which is passed in from the router
(derived from the verified token, never from the request body).
"""
import io

import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.supabase_client import get_supabase
from app.services.embeddings import embed_texts
from app.services import extractors


_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1200,
    chunk_overlap=200,
    length_function=len,
)


class IngestionError(Exception):
    """Raised when a PDF cannot be processed."""


def extract_pages(pdf_bytes: bytes) -> list[tuple[int, str]]:
    """Return [(page_number, text), ...] for pages that contain text.

    page_number is 1-based (what a human sees). Empty/scanned pages are
    skipped; if nothing has text we raise so the caller can mark the
    document failed rather than storing an empty vector set.
    """
    pages: list[tuple[int, str]] = []
    try:
        with fitz.open(stream=io.BytesIO(pdf_bytes), filetype="pdf") as pdf:
            for i, page in enumerate(pdf, start=1):
                text = page.get_text("text").strip()
                if text:
                    pages.append((i, text))
    except Exception as e:
        raise IngestionError(f"Could not read PDF: {e}") from e

    if not pages:
        raise IngestionError(
            "No extractable text found. The PDF may be scanned images "
            "rather than text."
        )
    return pages


def chunk_pages(pages: list[tuple[int, str]]) -> list[dict]:
    """Split each page into overlapping chunks, preserving page numbers.

    Returns [{content, page, chunk_index}, ...] in document order.
    """
    chunks: list[dict] = []
    index = 0
    for page_number, text in pages:
        for piece in _splitter.split_text(text):
            piece = piece.strip()
            if not piece:
                continue
            chunks.append(
                {"content": piece, "page": page_number, "chunk_index": index}
            )
            index += 1
    return chunks


def count_pages(pdf_bytes: bytes) -> int:
    """Total page count (used for plan validation before ingesting)."""
    try:
        with fitz.open(stream=io.BytesIO(pdf_bytes), filetype="pdf") as pdf:
            return pdf.page_count
    except Exception as e:
        raise IngestionError(f"Could not read PDF: {e}") from e


def ingest_document(
    *,
    user_id: str,
    filename: str,
    storage_path: str,
    pdf_bytes: bytes,
    chat_id: str | None = None,
) -> dict:
    """Run the full pipeline and persist everything. Returns a summary
    dict: {document_id, page_count, chunks_created, status}.

    The document row is created first with status 'processing' so it
    shows up in the UI immediately; it's flipped to 'ready' once chunks
    are stored, or 'failed' if anything breaks.
    """
    supabase = get_supabase()

    # --- create the document row up front (status: processing) ---
    total_pages = extractors.count_sections(filename, pdf_bytes)
    doc_insert = (
        supabase.table("documents")
        .insert(
            {
                "user_id": user_id,
                "filename": filename,
                "storage_path": storage_path,
                "page_count": total_pages,
                "file_size": len(pdf_bytes),
                "status": "processing",
                "chat_id": chat_id,
            }
        )
        .execute()
    )
    document_id = doc_insert.data[0]["id"]

    try:
        # --- extract -> chunk ---
        pages = extractors.extract_sections(filename, pdf_bytes)
        chunks = chunk_pages(pages)
        if not chunks:
            raise IngestionError("No text chunks were produced.")

        # --- embed (batched) ---
        vectors = embed_texts([c["content"] for c in chunks])

        # --- store chunk rows ---
        rows = [
            {
                "document_id": document_id,
                "user_id": user_id,
                "content": c["content"],
                "page": c["page"],
                "chunk_index": c["chunk_index"],
                "embedding": vec,
            }
            for c, vec in zip(chunks, vectors)
        ]
        # Insert in batches to stay well under request-size limits.
        for start in range(0, len(rows), 200):
            supabase.table("chunks").insert(rows[start : start + 200]).execute()

        # --- mark ready ---
        supabase.table("documents").update({"status": "ready"}).eq(
            "id", document_id
        ).execute()

        return {
            "document_id": document_id,
            "page_count": total_pages,
            "chunks_created": len(rows),
            "status": "ready",
        }

    except Exception as e:
        # Mark the document failed so the UI can show it and the user can
        # retry/delete. Re-raise so the router returns a clear error.
        supabase.table("documents").update({"status": "failed"}).eq(
            "id", document_id
        ).execute()
        if isinstance(e, IngestionError):
            raise
        raise IngestionError(f"Ingestion failed: {e}") from e
