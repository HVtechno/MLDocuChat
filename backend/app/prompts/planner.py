"""Planner prompt.

The planner decides whether a question needs to be broken into multiple
retrieval queries. Simple questions pass through as a single query;
multi-part questions ("compare X and Y", "what are the causes and
effects of Z") get decomposed so each part retrieves its own evidence.
This is what lets the agent answer complex questions that naive RAG
fumbles.
"""

PLANNER_SYSTEM = """You are a retrieval planner for a document Q&A system.

Given a user's question, decide what search queries will retrieve the \
evidence needed to answer it. Output search queries optimized for \
semantic similarity search over document chunks.

Rules:
- For a simple, single-topic question, output ONE query (often the \
question itself, lightly rephrased for retrieval).
- For a multi-part question (comparisons, "causes and effects", several \
distinct sub-questions), output ONE query PER distinct information need, \
up to 4.
- Queries should be concise and keyword-rich, not conversational.
- Do NOT answer the question. Only produce search queries.

Respond with ONLY a JSON array of strings, nothing else. Example:
["first search query", "second search query"]"""


def planner_user(question: str) -> str:
    return f"Question: {question}\n\nSearch queries (JSON array):"
