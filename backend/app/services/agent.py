"""The agentic RAG core.

Flow:
  1. PLAN     — ask the model to break the question into search queries.
  2. RETRIEVE — run each query against the vector store, pool the chunks.
  3. DEDUPE   — merge overlapping results, keep the best-scoring unique
                chunks, and number them for citation.
  4. ANSWER   — stream a grounded answer that cites chunks by number and
                admits when the documents don't contain the answer.

The answer streams token-by-token (for the ChatGPT/Claude-style UI), and
we return structured citations the frontend can render as source links.

Why this beats v1's naive RAG: planning handles multi-part questions,
the grounding rules cut hallucination, and citations make answers
verifiable — the difference between "a demo" and "something people trust
enough to pay for".
"""
import json
from collections.abc import Iterator

from openai import OpenAI

from app.config import get_settings
from app.prompts.answerer import answerer_system, answerer_user
from app.prompts.planner import PLANNER_SYSTEM, planner_user
from app.prompts.router import ROUTER_SYSTEM, router_user
from app.prompts.conversation import conversation_system
from app.services.retrieval import retrieve

_settings = get_settings()
_client = OpenAI(api_key=_settings.openai_api_key)

_MAX_CONTEXT_CHUNKS = 10   # cap excerpts sent to the answerer


def plan_queries(question: str) -> list[str]:
    """Ask the model for search queries. Falls back to the raw question
    if planning fails or returns nothing usable."""
    try:
        resp = _client.chat.completions.create(
            model=_settings.chat_model,
            messages=[
                {"role": "system", "content": PLANNER_SYSTEM},
                {"role": "user", "content": planner_user(question)},
            ],
            temperature=0,
        )
        raw = resp.choices[0].message.content.strip()
        # tolerate ```json fences
        raw = raw.replace("```json", "").replace("```", "").strip()
        queries = json.loads(raw)
        queries = [q for q in queries if isinstance(q, str) and q.strip()]
        return queries[:4] if queries else [question]
    except Exception:
        return [question]


def gather_chunks(
    *, user_id: str, queries: list[str], document_ids: list[str] | None,
    chat_id: str | None = None,
) -> list[dict]:
    """Run each query, pool results, dedupe by chunk id keeping the best
    similarity, and return the top chunks numbered for citation."""
    pooled: dict[str, dict] = {}
    for q in queries:
        for chunk in retrieve(
            user_id=user_id, query=q, top_k=8, document_ids=document_ids,
            chat_id=chat_id,
        ):
            existing = pooled.get(chunk["id"])
            if existing is None or chunk["similarity"] > existing["similarity"]:
                pooled[chunk["id"]] = chunk

    ranked = sorted(pooled.values(), key=lambda c: c["similarity"], reverse=True)
    top = ranked[:_MAX_CONTEXT_CHUNKS]

    # number them for citation
    for i, chunk in enumerate(top, start=1):
        chunk["n"] = i
    return top


def build_citations(chunks: list[dict]) -> list[dict]:
    """Structured citation payload for the frontend."""
    return [
        {
            "n": c["n"],
            "document_id": c["document_id"],
            "filename": c["filename"],
            "page": c["page"],
            "snippet": c["content"][:280],
        }
        for c in chunks
    ]


def classify_message(question: str, has_documents: bool) -> str:
    """Router: 'document' (needs retrieval) or 'conversation' (just chat)."""
    try:
        resp = _client.chat.completions.create(
            model=_settings.chat_model,
            messages=[
                {"role": "system", "content": ROUTER_SYSTEM},
                {"role": "user", "content": router_user(question, has_documents)},
            ],
            temperature=0,
            max_tokens=4,
        )
        label = resp.choices[0].message.content.strip().lower()
        return "document" if "document" in label else "conversation"
    except Exception:
        # If routing fails, fall back to document mode when docs exist.
        return "document" if has_documents else "conversation"


def _converse_stream(question, tone, language, has_documents):
    """Natural, non-document reply (greetings, small talk, general chat)."""
    system = conversation_system(tone, has_documents)
    if language and language.lower() not in ("en", "english", "auto"):
        system += f"\n\nRespond in {language}."
    stream = _client.chat.completions.create(
        model=_settings.chat_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": question},
        ],
        temperature=0.6,
        stream=True,
    )
    yield {"type": "citations", "citations": []}
    for part in stream:
        delta = part.choices[0].delta.content
        if delta:
            yield {"type": "token", "text": delta}
    yield {"type": "done"}


def answer_stream(
    *,
    user_id: str,
    question: str,
    document_ids: list[str] | None = None,
    chat_id: str | None = None,
    tone: str = "casual",
    language: str | None = None,
    has_documents: bool = True,
) -> Iterator[dict]:
    """Run the agent and yield streaming events.

    First routes the message: conversational messages (greetings, small
    talk, general questions) get a natural reply; document questions go
    through the retrieve → cite pipeline. Tone and language shape both.
    """
    # 1. Route: is this a document question or just conversation?
    kind = classify_message(question, has_documents)

    if kind == "conversation":
        yield from _converse_stream(question, tone, language, has_documents)
        return

    # 2. Document path: plan → retrieve → answer with citations.
    queries = plan_queries(question)
    chunks = gather_chunks(
        user_id=user_id, queries=queries, document_ids=document_ids,
        chat_id=chat_id,
    )

    if not chunks:
        # Even here, reply naturally rather than a curt "not found".
        yield {"type": "citations", "citations": []}
        msg = ("I looked, but I couldn't find anything about that in your "
               "documents for this chat. Could you rephrase, or upload a "
               "document that covers it?")
        yield {"type": "token", "text": msg}
        yield {"type": "done"}
        return

    yield {"type": "citations", "citations": build_citations(chunks)}

    stream = _client.chat.completions.create(
        model=_settings.chat_model,
        messages=[
            {"role": "system", "content": answerer_system(tone, language)},
            {"role": "user", "content": answerer_user(question, chunks)},
        ],
        temperature=0.2,
        stream=True,
    )
    for part in stream:
        delta = part.choices[0].delta.content
        if delta:
            yield {"type": "token", "text": delta}

    yield {"type": "done"}
