"""Thin wrapper around OpenAI embeddings.

Kept separate so the model choice lives in one place and the ingestion
code stays readable. Batches requests because OpenAI accepts many texts
per call — far faster and cheaper than one call per chunk.
"""
from openai import OpenAI

from app.config import get_settings

_settings = get_settings()
_client = OpenAI(api_key=_settings.openai_api_key)

# OpenAI allows large batches; 100 keeps requests comfortably sized.
_BATCH_SIZE = 100


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of texts, returning one vector per text (in order)."""
    if not texts:
        return []

    vectors: list[list[float]] = []
    for start in range(0, len(texts), _BATCH_SIZE):
        batch = texts[start : start + _BATCH_SIZE]
        response = _client.embeddings.create(
            model=_settings.embedding_model,
            input=batch,
        )
        # response.data preserves input order
        vectors.extend(item.embedding for item in response.data)
    return vectors


def embed_query(text: str) -> list[float]:
    """Embed a single query string (used by retrieval in step 3)."""
    return embed_texts([text])[0]
