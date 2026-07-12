"""Tests for the pure agent logic: dedup, ranking, citation building.

These don't call OpenAI — they verify the deterministic plumbing that
decides which chunks reach the answerer and how citations are shaped.
We monkeypatch retrieve() so we control what comes back.
"""
import app.services.agent as agent_mod
from app.services.agent import gather_chunks, build_citations


def _chunk(cid, sim, doc="doc1", page=1, content="text"):
    return {
        "id": cid,
        "document_id": doc,
        "content": content,
        "page": page,
        "filename": "f.pdf",
        "similarity": sim,
    }


def test_gather_dedupes_and_keeps_best_similarity(monkeypatch):
    # Same chunk id returned by two queries with different scores.
    calls = iter([
        [_chunk("a", 0.7), _chunk("b", 0.6)],
        [_chunk("a", 0.9), _chunk("c", 0.5)],
    ])
    monkeypatch.setattr(agent_mod, "retrieve", lambda **kw: next(calls))

    chunks = gather_chunks(user_id="u", queries=["q1", "q2"], document_ids=None)
    ids = {c["id"]: c["similarity"] for c in chunks}
    assert set(ids) == {"a", "b", "c"}        # deduped
    assert ids["a"] == 0.9                     # kept the higher score


def test_gather_ranks_by_similarity_descending(monkeypatch):
    monkeypatch.setattr(
        agent_mod, "retrieve",
        lambda **kw: [_chunk("a", 0.3), _chunk("b", 0.8), _chunk("c", 0.5)],
    )
    chunks = gather_chunks(user_id="u", queries=["q"], document_ids=None)
    sims = [c["similarity"] for c in chunks]
    assert sims == sorted(sims, reverse=True)


def test_gather_numbers_chunks_for_citation(monkeypatch):
    monkeypatch.setattr(
        agent_mod, "retrieve",
        lambda **kw: [_chunk("a", 0.9), _chunk("b", 0.8)],
    )
    chunks = gather_chunks(user_id="u", queries=["q"], document_ids=None)
    assert [c["n"] for c in chunks] == [1, 2]


def test_build_citations_shape():
    chunks = [_chunk("a", 0.9, content="x" * 500)]
    chunks[0]["n"] = 1
    cites = build_citations(chunks)
    assert cites[0]["n"] == 1
    assert cites[0]["filename"] == "f.pdf"
    assert len(cites[0]["snippet"]) <= 280      # snippet is truncated
