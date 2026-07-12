"""Chat endpoints.

The main one is POST /chat/ask: it streams the agent's answer as
Server-Sent Events (SSE) so the frontend can render tokens live, then
persists the full turn (question + answer + citations).

Chats and messages are always scoped to the authenticated user's id.
"""
import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.deps import get_current_user
from app.core.supabase_client import get_supabase
from app.models.chat import AskRequest, ChatOut, MessageOut
from app.services import agent

router = APIRouter(prefix="/chat", tags=["chat"])


def _ensure_chat(user_id: str, chat_id: str | None, first_question: str) -> str:
    """Return a chat_id, creating a new chat (titled from the question)
    if none was supplied. Verifies ownership if one was."""
    supabase = get_supabase()
    if chat_id:
        owned = (
            supabase.table("chats")
            .select("id, title")
            .eq("id", chat_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not owned.data:
            raise HTTPException(status_code=404, detail="Chat not found.")
        # If this project is still untitled, name it from the
        # first real question the user asks.
        current_title = owned.data[0].get("title")
        if current_title in (None, "", "New chat", "New project"):
            title = (first_question[:60] + "…") if len(first_question) > 60 else first_question
            supabase.table("chats").update({"title": title}).eq("id", chat_id).execute()
        return chat_id

    title = (first_question[:60] + "…") if len(first_question) > 60 else first_question
    created = (
        supabase.table("chats")
        .insert({"user_id": user_id, "title": title})
        .execute()
    )
    return created.data[0]["id"]


@router.get("/list", response_model=list[ChatOut])
async def list_chats(user=Depends(get_current_user)):
    """List chats, hiding empty ones (no messages AND no documents) so the
    sidebar doesn't fill up with abandoned 'New chat' entries."""
    supabase = get_supabase()
    uid = user["id"]
    chats = (
        supabase.table("chats")
        .select("id, title, created_at")
        .eq("user_id", uid)
        .order("created_at", desc=True)
        .execute()
    ).data or []

    if not chats:
        return []

    # chats that have at least one message
    msgs = supabase.table("messages").select("chat_id").eq("user_id", uid).execute()
    with_messages = {m["chat_id"] for m in (msgs.data or [])}
    # chats that have at least one document
    docs = supabase.table("documents").select("chat_id").eq("user_id", uid).execute()
    with_docs = {d["chat_id"] for d in (docs.data or []) if d.get("chat_id")}

    active = with_messages | with_docs
    return [c for c in chats if c["id"] in active]


@router.get("/{chat_id}/messages", response_model=list[MessageOut])
async def list_messages(chat_id: str, user=Depends(get_current_user)):
    supabase = get_supabase()
    # ownership check
    owned = (
        supabase.table("chats")
        .select("id")
        .eq("id", chat_id)
        .eq("user_id", user["id"])
        .execute()
    )
    if not owned.data:
        raise HTTPException(status_code=404, detail="Chat not found.")

    result = (
        supabase.table("messages")
        .select("id, role, content, citations, created_at")
        .eq("chat_id", chat_id)
        .order("created_at", desc=False)
        .execute()
    )
    return result.data or []


@router.post("/create", response_model=ChatOut)
async def create_chat(user=Depends(get_current_user)):
    """Create an empty chat up front. Used when the user uploads a
    document in a fresh chat before sending any message — the upload
    needs a chat_id to attach to."""
    supabase = get_supabase()
    created = (
        supabase.table("chats")
        .insert({"user_id": user["id"], "title": "New project"})
        .execute()
    )
    return created.data[0]


@router.post("/ask")
async def ask(req: AskRequest, user=Depends(get_current_user)):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    user_id = user["id"]
    chat_id = _ensure_chat(user_id, req.chat_id, question)
    supabase = get_supabase()

    # persist the user's message immediately
    supabase.table("messages").insert(
        {"chat_id": chat_id, "user_id": user_id, "role": "user", "content": question}
    ).execute()

    # Does THIS chat have any ready documents? If not, we won't call the
    # model — we return a friendly prompt, and include the user's other
    # documents so the frontend can offer them for reuse.
    docs_here = (
        supabase.table("documents").select("id", count="exact")
        .eq("user_id", user_id).eq("chat_id", chat_id).eq("status", "ready")
        .execute()
    )
    has_docs = (docs_here.count or 0) > 0

    other_docs = []
    if not has_docs:
        others = (
            supabase.table("documents")
            .select("id, filename, page_count")
            .eq("user_id", user_id).eq("status", "ready")
            .order("created_at", desc=True).execute()
        )
        # de-dupe by filename so the picker isn't cluttered with copies
        seen = set()
        for d in (others.data or []):
            if d["filename"] in seen:
                continue
            seen.add(d["filename"])
            other_docs.append(d)

    def event_stream():
        collected_text: list[str] = []
        citations: list = []

        yield _sse({"type": "chat", "chat_id": chat_id})

        if not has_docs:
            # No documents in this chat. But the message might just be a
            # greeting or small talk — classify it first. If it's a real
            # document question, show the picker; otherwise chat naturally.
            kind = agent.classify_message(question, has_documents=False)

            if kind == "document":
                # They're asking about documents they haven't added — offer
                # the picker (or invite an upload).
                if other_docs:
                    msg = ("There are no documents in this chat yet. You've "
                           "uploaded some before, though — pick one below to use "
                           "it here, or upload a new PDF to get started.")
                else:
                    msg = ("There are no documents in this chat yet. Upload a "
                           "PDF using the panel on the left and I'll answer "
                           "questions about it.")
                yield _sse({"type": "no_documents", "documents": other_docs})
                collected_text.append(msg)
                yield _sse({"type": "token", "text": msg})
                yield _sse({"type": "done"})
                supabase.table("messages").insert({
                    "chat_id": chat_id, "user_id": user_id, "role": "assistant",
                    "content": msg, "citations": [],
                }).execute()
                return

            # Conversational — reply naturally (greetings, small talk, etc.)
            for event in agent.answer_stream(
                user_id=user_id, question=question,
                document_ids=req.document_ids, chat_id=chat_id,
                tone=req.tone or "casual", language=req.language,
                has_documents=False,
            ):
                if event["type"] == "citations":
                    citations = event["citations"]
                elif event["type"] == "token":
                    collected_text.append(event["text"])
                yield _sse(event)
            supabase.table("messages").insert({
                "chat_id": chat_id, "user_id": user_id, "role": "assistant",
                "content": "".join(collected_text), "citations": citations,
            }).execute()
            return

        for event in agent.answer_stream(
            user_id=user_id, question=question,
            document_ids=req.document_ids, chat_id=chat_id,
            tone=req.tone or "casual", language=req.language,
            has_documents=True,
        ):
            if event["type"] == "citations":
                citations = event["citations"]
            elif event["type"] == "token":
                collected_text.append(event["text"])
            yield _sse(event)

        supabase.table("messages").insert(
            {
                "chat_id": chat_id,
                "user_id": user_id,
                "role": "assistant",
                "content": "".join(collected_text),
                "citations": citations,
            }
        ).execute()

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(chat_id: str, user=Depends(get_current_user)):
    supabase = get_supabase()
    supabase.table("chats").delete().eq("id", chat_id).eq(
        "user_id", user["id"]
    ).execute()


def _sse(payload: dict) -> str:
    """Format a dict as a Server-Sent Event line."""
    return f"data: {json.dumps(payload)}\n\n"
