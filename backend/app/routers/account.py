"""Account & data-control endpoints.

Bulk operations for the Settings > Data Controls panel:
  - delete all chats (keeps documents)
  - export everything (chats + messages + document list) as JSON
  - delete account data (wipe chats, documents, chunks, files)

All scoped to the authenticated user.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from app.deps import get_current_user
from app.core.supabase_client import get_supabase
from app.services import storage

router = APIRouter(prefix="/account", tags=["account"])


@router.delete("/chats")
async def delete_all_chats(user=Depends(get_current_user)):
    """Delete every chat (and its messages, via cascade). Documents stay,
    but they become unattached since their chat is gone."""
    supabase = get_supabase()
    supabase.table("chats").delete().eq("user_id", user["id"]).execute()
    return {"deleted": "all_chats"}


@router.get("/export")
async def export_data(user=Depends(get_current_user)):
    """Return the user's chats, messages, and document list as JSON."""
    supabase = get_supabase()
    uid = user["id"]

    chats = supabase.table("chats").select("*").eq("user_id", uid).execute().data or []
    messages = supabase.table("messages").select("*").eq("user_id", uid).execute().data or []
    documents = (
        supabase.table("documents")
        .select("id, filename, page_count, status, created_at, chat_id")
        .eq("user_id", uid).execute().data or []
    )

    payload = {
        "account": {"id": uid, "email": user.get("email")},
        "chats": chats,
        "messages": messages,
        "documents": documents,
    }
    headers = {"Content-Disposition": "attachment; filename=foliq-export.json"}
    return JSONResponse(content=payload, headers=headers)


@router.delete("/data")
async def delete_account_data(user=Depends(get_current_user)):
    """Fully delete the account: wipe all data (chats, messages, documents,
    chunks, files) AND remove the auth login itself so the credentials no
    longer exist. Irreversible.
    """
    supabase = get_supabase()
    uid = user["id"]

    # remove stored PDF files first (best-effort)
    docs = supabase.table("documents").select("storage_path").eq("user_id", uid).execute()
    for d in (docs.data or []):
        if d.get("storage_path"):
            storage.delete_pdf(d["storage_path"])

    # deleting documents cascades to chunks; deleting chats cascades to messages
    supabase.table("documents").delete().eq("user_id", uid).execute()
    supabase.table("chats").delete().eq("user_id", uid).execute()

    # delete the profile row, then the auth user itself (admin API, needs
    # the service key). After this the email/password no longer exist.
    supabase.table("profiles").delete().eq("id", uid).execute()

    # Delete the auth login using a FRESH admin client (never carries a
    # user session), so it always has full service-role authority.
    import logging
    from app.core.supabase_client import get_admin_supabase
    try:
        get_admin_supabase().auth.admin.delete_user(uid)
    except Exception as e:
        logging.error("Auth user deletion failed for %s: %r", uid, e)
        raise HTTPException(
            status_code=500,
            detail=f"Account data was removed, but the login could not be "
            f"deleted: {e}. Please contact support.",
        )

    return {"deleted": "account_and_auth"}
