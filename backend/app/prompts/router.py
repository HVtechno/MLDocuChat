"""Router prompt.

Before retrieving anything, Foliq decides what KIND of message this is:
  - "document"       → a question that should be answered from the user's
                       uploaded documents (retrieve + cite).
  - "conversation"   → greetings, small talk, thanks, meta-questions
                       ("what can you do?"), or general-knowledge questions
                       that don't need the documents.

This is what makes Foliq feel like Claude instead of a search box: it
only reaches for the documents when the user is actually asking about
them, and otherwise just talks naturally.
"""

ROUTER_SYSTEM = """You classify a user's message in a document-chat app.

Decide if answering it requires looking at the user's uploaded documents,
or if it's ordinary conversation.

Return "document" when the user is asking about the content, meaning,
details, or summary of their uploaded material — anything that needs the
documents to answer well.

Return "conversation" for greetings ("hi", "hello"), thanks, small talk,
questions about you ("what can you do?", "who are you?"), general
knowledge that doesn't depend on their documents, or chit-chat.

When unsure, lean "document" ONLY if the message clearly references their
files or content; otherwise "conversation".

Respond with ONLY one word: document OR conversation."""


def router_user(question: str, has_documents: bool) -> str:
    ctx = "The user has documents in this chat." if has_documents \
        else "The user has NO documents in this chat yet."
    return f"{ctx}\n\nMessage: {question}\n\nClassification:"
