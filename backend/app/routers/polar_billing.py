"""Polar subscription billing (adapted from Resuviq for Supabase).

Polar is a Merchant of Record: it handles VAT/tax globally, no company
registration needed. The webhook is the SOURCE OF TRUTH for plan changes —
we never grant Pro based on the browser 'success' redirect (that's just UX);
access is granted here after Polar confirms payment via a signed webhook.

Endpoints:
  GET  /billing/subscription    -> current user's plan/status (auth)
  POST /billing/create-checkout -> start Pro checkout, returns {url} (auth)
  POST /billing/webhook         -> Polar -> us; flips plans. Signature-verified.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from app.deps import get_current_user
from app.core.supabase_client import get_admin_supabase
from app.core.polar_client import (
    get_polar, polar_configured,
    POLAR_PRODUCT_ID, POLAR_SUCCESS_URL, POLAR_WEBHOOK_SECRET,
)

router = APIRouter(prefix="/billing", tags=["billing"])


def _as_utc_iso(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        dt = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return (dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)).isoformat()
    except (ValueError, TypeError):
        return None


@router.get("/subscription")
async def get_subscription(user=Depends(get_current_user)):
    """The caller's plan, read from our own profile (kept current by the
    webhook) rather than calling Polar on every page load."""
    supabase = get_admin_supabase()
    prof = (
        supabase.table("profiles")
        .select("plan, subscription_status, current_period_end")
        .eq("id", user["id"]).single().execute()
    ).data or {}
    return {
        "plan": prof.get("plan", "free"),
        "subscription_status": prof.get("subscription_status", "none"),
        "current_period_end": prof.get("current_period_end"),
        "configured": polar_configured(),
    }


@router.post("/create-checkout")
async def create_checkout(user=Depends(get_current_user)):
    """Create a Polar checkout for Pro and return {url}. The frontend
    redirects the browser there; Polar's hosted page collects payment."""
    if not polar_configured():
        raise HTTPException(
            status_code=503,
            detail="Billing isn't set up yet. Please try again later.",
        )
    email = user.get("email")
    try:
        with get_polar() as polar:
            checkout = polar.checkouts.create(request={
                "products": [POLAR_PRODUCT_ID],
                "customer_email": email,
                "external_customer_id": user["id"],   # stable link to our user
                "success_url": POLAR_SUCCESS_URL,
                "metadata": {"app_user_id": user["id"], "app_user_email": email or ""},
            })
        url = getattr(checkout, "url", None)
        if not url:
            raise HTTPException(status_code=502, detail="Polar did not return a checkout URL.")
        return {"url": url}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[polar] create-checkout failed for {email}: {type(e).__name__}: {e}")
        raise HTTPException(status_code=502, detail="Could not start checkout. Please try again.")


# ── Webhook (no auth — verified by Polar signature) ──────────────────────────

def _resolve_user_id(data) -> str | None:
    """Get our user id from a webhook payload. Prefer the metadata / external
    id we set at checkout, fall back to the nested customer email lookup."""
    meta = getattr(data, "metadata", None) or {}
    if isinstance(meta, dict) and meta.get("app_user_id"):
        return meta["app_user_id"]
    ext = getattr(data, "external_customer_id", None)
    if ext:
        return ext
    return None


def _grant_pro(supabase, user_id, data):
    supabase.table("profiles").update({
        "plan": "pro",
        "subscription_status": "active",
        "current_period_end": _as_utc_iso(getattr(data, "current_period_end", None)),
    }).eq("id", user_id).execute()


def _downgrade(supabase, user_id):
    supabase.table("profiles").update({
        "plan": "free",
        "subscription_status": "canceled",
    }).eq("id", user_id).execute()


@router.post("/webhook")
async def polar_webhook(request: Request):
    """Polar -> us. The ONLY place Pro is granted/revoked. Signature-verified."""
    if not POLAR_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Webhook secret not configured.")

    from polar_sdk.webhooks import (
        validate_event, WebhookVerificationError, WebhookUnknownTypeError,
    )
    raw = await request.body()
    headers = dict(request.headers)
    try:
        event = validate_event(raw, headers, POLAR_WEBHOOK_SECRET)
    except WebhookVerificationError:
        raise HTTPException(status_code=403, detail="Invalid webhook signature.")
    except WebhookUnknownTypeError:
        return {"received": True}

    etype = getattr(event, "TYPE", None) or getattr(event, "type", None)
    data = getattr(event, "data", None)
    if data is None:
        return {"received": True}

    user_id = _resolve_user_id(data)
    if not user_id:
        return {"received": True}

    supabase = get_admin_supabase()
    if etype in ("subscription.created", "subscription.active", "subscription.updated", "order.paid"):
        _grant_pro(supabase, user_id, data)
    elif etype in ("subscription.canceled", "subscription.revoked"):
        _downgrade(supabase, user_id)

    return {"received": True}
