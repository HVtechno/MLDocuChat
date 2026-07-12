"""Shared FastAPI dependencies.

The important one is get_current_user: it derives the user's identity
from the verified Supabase JWT in the Authorization header — NEVER from
a username in the request body. This structurally closes the v1 hole
where any logged-in user could pass someone else's username and act as
them.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.supabase_client import get_admin_supabase


bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict:
    """Verify the Supabase access token and return the user record.

    Uses a fresh admin client for verification so the shared cached client
    never gets a user session attached to it (which would downgrade its
    privileges and break admin operations later in the request).
    """
    if creds is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token.",
        )

    supabase = get_admin_supabase()
    try:
        result = supabase.auth.get_user(creds.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    user = getattr(result, "user", None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    return {"id": user.id, "email": user.email}
