"""Tests for the pure ingestion logic (chunking + page tracking).

These don't touch Supabase or OpenAI — they verify the part most likely
to have subtle bugs: that page numbers survive chunking and chunk order
is preserved, which is what makes citations trustworthy later.
"""
from app.services.ingestion import chunk_pages


def test_chunk_pages_preserves_page_numbers():
    pages = [(1, "alpha text on page one"), (2, "beta text on page two")]
    chunks = chunk_pages(pages)
    assert {c["page"] for c in chunks} == {1, 2}


def test_chunk_index_is_sequential():
    pages = [(1, "some text"), (2, "more text"), (3, "even more")]
    chunks = chunk_pages(pages)
    indices = [c["chunk_index"] for c in chunks]
    assert indices == list(range(len(chunks)))


def test_empty_pages_produce_no_chunks():
    assert chunk_pages([]) == []


def test_whitespace_only_page_is_skipped():
    pages = [(1, "   \n  "), (2, "real content here")]
    chunks = chunk_pages(pages)
    assert all(c["page"] == 2 for c in chunks)
    assert len(chunks) >= 1


def test_long_page_splits_into_multiple_chunks():
    # A page longer than chunk_size should yield more than one chunk,
    # all tagged with the same page number.
    long_text = "word " * 1000  # ~5000 chars, well over chunk_size 1200
    chunks = chunk_pages([(7, long_text)])
    assert len(chunks) > 1
    assert all(c["page"] == 7 for c in chunks)
