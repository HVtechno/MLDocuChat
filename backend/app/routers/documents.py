"""Document endpoints. Thin: validate, call services, return.

Documents are scoped to chats: each document belongs to one chat and a
chat only searches its own documents. Documents are still saved globally
per user, so a "library" endpoint lists everything for the pick-from-
previous flow.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status

from app.deps import get_current_user
from app.core.supabase_client import get_supabase
from app.models.document import DocumentOut, UploadResult
from app.services import ingestion, storage, extractors
from app.services.billing import check_file_allowed, get_plan
from app.config import is_admin_email

router = APIRouter(prefix="/documents", tags=["documents"])


def _user_plan(user_id: str) -> str:
    supabase = get_supabase()
    result = (
        supabase.table("profiles").select("plan").eq("id", user_id).single().execute()
    )
    return (result.data or {}).get("plan", "free")


@router.get("", response_model=list[DocumentOut])
async def list_documents(chat_id: str | None = None, user=Depends(get_current_user)):
    """Documents for a chat (chat_id given), or the user's whole library
    (no chat_id) for the pick-from-previous picker."""
    supabase = get_supabase()
    q = (
        supabase.table("documents")
        .select("id, filename, page_count, status, created_at, chat_id")
        .eq("user_id", user["id"])
    )
    if chat_id:
        q = q.eq("chat_id", chat_id)
    result = q.order("created_at", desc=True).execute()
    return result.data or []


@router.post("", response_model=UploadResult, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    chat_id: str = Form(...),
    user=Depends(get_current_user),
):
    if not file.filename or not extractors.is_supported(file.filename):
        supported = ", ".join(sorted(set(extractors.SUPPORTED.values())))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported formats: {supported}.",
        )

    supabase = get_supabase()
    # Verify the chat belongs to this user (upload always targets a chat).
    owned = (
        supabase.table("chats").select("id")
        .eq("id", chat_id).eq("user_id", user["id"]).execute()
    )
    if not owned.data:
        raise HTTPException(status_code=404, detail="Chat not found.")

    pdf_bytes = await file.read()
    file_mb = len(pdf_bytes) / (1024 * 1024)

    # Admins bypass all plan limits (for testing and management).
    admin = is_admin_email(user.get("email"))
    plan_key = _user_plan(user["id"])
    plan = get_plan(plan_key)

    if not admin:
        # document count limit (across the whole account)
        existing = (
            supabase.table("documents").select("id", count="exact")
            .eq("user_id", user["id"]).execute()
        )
        if plan.max_documents != float("inf") and (existing.count or 0) >= plan.max_documents:
            raise HTTPException(
                status_code=403,
                detail=f"You've reached the {plan.label} limit of "
                f"{plan.max_documents} documents. Upgrade to Pro for your full library.",
            )

    try:
        pages = extractors.count_sections(file.filename, pdf_bytes)
    except (ingestion.IngestionError, extractors.ExtractionError) as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not admin:
        ok, err = check_file_allowed(plan_key, file_mb, pages)
        if not ok:
            raise HTTPException(status_code=403, detail=err)

    storage_path = storage.upload_pdf(user["id"], file.filename, pdf_bytes)

    try:
        summary = ingestion.ingest_document(
            user_id=user["id"],
            filename=file.filename,
            storage_path=storage_path,
            pdf_bytes=pdf_bytes,
            chat_id=chat_id,
        )
    except (ingestion.IngestionError, extractors.ExtractionError) as e:
        storage.delete_pdf(storage_path)
        raise HTTPException(status_code=422, detail=str(e))

    doc = (
        supabase.table("documents")
        .select("id, filename, page_count, status, created_at, chat_id")
        .eq("id", summary["document_id"]).single().execute()
    )
    return {"document": doc.data, "chunks_created": summary["chunks_created"]}


@router.post("/{document_id}/attach", response_model=DocumentOut)
async def attach_document(document_id: str, chat_id: str = Form(...),
                          user=Depends(get_current_user)):
    """Copy a previously-uploaded document into another chat, so its
    content becomes searchable there. Chunks are duplicated with the new
    chat's scope so each chat is self-contained."""
    supabase = get_supabase()

    # verify chat ownership
    owned = (
        supabase.table("chats").select("id")
        .eq("id", chat_id).eq("user_id", user["id"]).execute()
    )
    if not owned.data:
        raise HTTPException(status_code=404, detail="Chat not found.")

    # verify source document ownership
    src = (
        supabase.table("documents")
        .select("filename, storage_path, page_count")
        .eq("id", document_id).eq("user_id", user["id"]).single().execute()
    )
    if not src.data:
        raise HTTPException(status_code=404, detail="Document not found.")

    # create the new document row in this chat
    new_doc = (
        supabase.table("documents").insert({
            "user_id": user["id"],
            "filename": src.data["filename"],
            "storage_path": src.data["storage_path"],
            "page_count": src.data["page_count"],
            "status": "ready",
            "chat_id": chat_id,
        }).execute()
    )
    new_id = new_doc.data[0]["id"]

    # duplicate the chunks (with embeddings) into the new document/chat scope
    chunks = (
        supabase.table("chunks")
        .select("content, page, chunk_index, embedding")
        .eq("document_id", document_id).eq("user_id", user["id"]).execute()
    )
    rows = [{
        "document_id": new_id,
        "user_id": user["id"],
        "content": c["content"],
        "page": c["page"],
        "chunk_index": c["chunk_index"],
        "embedding": c["embedding"],
    } for c in (chunks.data or [])]
    for start in range(0, len(rows), 200):
        supabase.table("chunks").insert(rows[start:start + 200]).execute()

    doc = (
        supabase.table("documents")
        .select("id, filename, page_count, status, created_at, chat_id")
        .eq("id", new_id).single().execute()
    )
    return doc.data


@router.post("/delete-batch", status_code=status.HTTP_200_OK)
async def delete_documents_batch(payload: dict, user=Depends(get_current_user)):
    """Delete multiple documents at once (Settings > Documents multi-select).

    Because 'attach' duplicates a document into other chats (same filename,
    different ids), deleting a document also removes all other copies that
    share its filename — so 'delete' means it's truly gone everywhere, which
    is what users expect."""
    ids = payload.get("document_ids") or []
    if not ids:
        return {"deleted": 0}
    supabase = get_supabase()

    # find the filenames of the selected documents
    selected = (
        supabase.table("documents").select("id, filename, storage_path")
        .eq("user_id", user["id"]).in_("id", ids).execute()
    )
    filenames = list({r["filename"] for r in (selected.data or [])})
    if not filenames:
        return {"deleted": 0}

    # gather ALL documents (all copies) sharing those filenames
    all_copies = (
        supabase.table("documents").select("id, storage_path")
        .eq("user_id", user["id"]).in_("filename", filenames).execute()
    )
    copy_ids = [r["id"] for r in (all_copies.data or [])]

    # remove stored files (dedupe storage paths)
    paths = {r["storage_path"] for r in (all_copies.data or []) if r.get("storage_path")}
    for p in paths:
        storage.delete_pdf(p)

    # delete all matching document rows (chunks cascade)
    supabase.table("documents").delete().eq("user_id", user["id"]).in_(
        "id", copy_ids
    ).execute()
    return {"deleted": len(copy_ids)}


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: str, user=Depends(get_current_user)):
    supabase = get_supabase()
    doc = (
        supabase.table("documents").select("storage_path")
        .eq("id", document_id).eq("user_id", user["id"]).single().execute()
    )
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Chunks cascade-delete via the FK; remove the stored file too.
    supabase.table("documents").delete().eq("id", document_id).eq(
        "user_id", user["id"]
    ).execute()
    storage.delete_pdf(doc.data["storage_path"])
