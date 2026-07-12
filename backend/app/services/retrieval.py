"""Retrieval: turn a query string into the most relevant chunks.

Wraps the match_chunks Postgres function (defined in schema.sql), which
runs the vector search inside the database AND filters by user_id — so
retrieval can never return another user's chunks, even if calling code
is wrong.
"""
from app.core.supabase_client import get_supabase
from app.services.embeddings import embed_query


def retrieve(
    *,
    user_id: str,
    query: str,
    top_k: int = 8,
    document_ids: list[str] | None = None,
    chat_id: str | None = None,
) -> list[dict]:
    """Return the top_k most similar chunks for a query.

    Each result: {id, document_id, content, page, filename, similarity}.
    Optionally restrict to specific document_ids (e.g. the user picked
    one document to chat with).
    """
    query_embedding = embed_query(query)
    supabase = get_supabase()

    result = supabase.rpc(
        "match_chunks",
        {
            "query_embedding": query_embedding,
            "match_user_id": user_id,
            "match_count": top_k,
            "filter_document_ids": document_ids,
            "match_chat_id": chat_id,
        },
    ).execute()

    return result.data or []
