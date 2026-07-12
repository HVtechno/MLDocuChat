"""Predefined research synthesis actions.

These power the one-click buttons researchers see (Find agreements, Find
conflicts, Spot gaps, Summarise the landscape). Each maps to a carefully
worded question that reliably triggers cross-paper synthesis — so the
researcher doesn't have to know the 'magic phrasing'. The button sends the
mapped question through the normal ask pipeline, so the answer streams and
cites exactly like a typed question, and the conversation can continue.
"""

SYNTHESIS_ACTIONS = {
    "agreements": (
        "Looking across all the documents in this project, where do they "
        "agree? Identify the points of consensus and cite which documents "
        "support each one."
    ),
    "conflicts": (
        "Looking across all the documents in this project, where do they "
        "disagree or contradict each other? Name each point of tension and "
        "cite which documents hold which position."
    ),
    "gaps": (
        "Looking across all the documents in this project, what is missing "
        "or unaddressed? Identify gaps the documents themselves point to or "
        "leave open, and cite where relevant."
    ),
    "landscape": (
        "Give me a synthesised overview of what these documents collectively "
        "say about the topic. Organise it by theme rather than document by "
        "document, note where sources align or differ, and cite throughout."
    ),
}


def action_question(action: str) -> str | None:
    """Return the question for a synthesis action, or None if unknown."""
    return SYNTHESIS_ACTIONS.get(action)
