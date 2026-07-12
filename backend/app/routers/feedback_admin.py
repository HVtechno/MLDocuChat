"""Feedback submission + admin analytics.

Feedback: any logged-in user can submit a 1-5 star rating with an optional
comment, stored in the `feedback` table.

Admin: aggregate, read-only analytics for the owner only (gated by
ADMIN_EMAILS). Deliberately AGGREGATE — totals, breakdowns, counts — never
exposing the content of users' documents, honouring Foliq's privacy promise.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.deps import get_current_user
from app.config import get_settings
from app.core.supabase_client import get_admin_supabase

router = APIRouter(tags=["feedback-admin"])
_settings = get_settings()


def _admin_emails() -> set[str]:
    return {e.strip().lower() for e in _settings.admin_emails.split(",") if e.strip()}


def require_admin(user=Depends(get_current_user)):
    email = (user.get("email") or "").lower()
    if not email or email not in _admin_emails():
        raise HTTPException(status_code=403, detail="Admins only.")
    return user


# ── Feedback ─────────────────────────────────────────────────────────────────

class FeedbackIn(BaseModel):
    rating: int
    comment: str | None = None


@router.post("/feedback")
async def submit_feedback(body: FeedbackIn, user=Depends(get_current_user)):
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5.")
    supabase = get_admin_supabase()
    supabase.table("feedback").insert({
        "user_id": user["id"],
        "email": user.get("email"),
        "rating": body.rating,
        "comment": (body.comment or "").strip() or None,
    }).execute()
    return {"ok": True}


# ── Admin metrics (aggregate only) ───────────────────────────────────────────

@router.get("/admin/metrics")
async def admin_metrics(user=Depends(require_admin)):
    """One payload of aggregate stats for the admin dashboard. Reads only —
    never returns document contents or per-user private data."""
    supabase = get_admin_supabase()

    # Users
    profiles = supabase.table("profiles").select("id, plan, created_at").execute().data or []
    total_users = len(profiles)
    pro_users = sum(1 for p in profiles if p.get("plan") == "pro")

    # Documents — filename (for extension), size, status. No content.
    docs = supabase.table("documents").select(
        "filename, file_size, page_count, status, created_at"
    ).execute().data or []
    total_docs = len(docs)

    # File-type breakdown by extension
    type_counts: dict[str, int] = {}
    total_bytes = 0
    total_pages = 0
    for d in docs:
        name = (d.get("filename") or "").lower()
        ext = name[name.rfind("."):] if "." in name else "other"
        type_counts[ext] = type_counts.get(ext, 0) + 1
        total_bytes += int(d.get("file_size") or 0)
        total_pages += int(d.get("page_count") or 0)

    # Feedback
    fb = supabase.table("feedback").select(
        "rating, comment, email, created_at"
    ).order("created_at", desc=True).limit(100).execute().data or []
    avg_rating = round(sum(f["rating"] for f in fb) / len(fb), 2) if fb else None

    return {
        "users": {"total": total_users, "pro": pro_users, "free": total_users - pro_users},
        "documents": {
            "total": total_docs,
            "total_mb": round(total_bytes / (1024 * 1024), 1),
            "total_pages": total_pages,
            "by_type": type_counts,
        },
        "feedback": {
            "count": len(fb),
            "average_rating": avg_rating,
            "recent": fb,
        },
    }
