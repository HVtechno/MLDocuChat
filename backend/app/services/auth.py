"""Auth service — wraps Supabase Auth.

Supabase handles the hard parts (password hashing, email verification,
token issuance). We never store or see passwords ourselves. The profile
row is auto-created by the on_auth_user_created trigger (rls_policies.sql),
so signup here only needs to create the auth user.
"""
from app.core.supabase_client import get_supabase


class AuthError(Exception):
    """Raised when signup/login fails, with a user-safe message."""


def sign_up(email: str, password: str, nickname: str | None = None) -> dict:
    """Create a new auth user. Returns {user_id, needs_confirmation}.

    Depending on your Supabase email-confirmation setting, the user may
    need to confirm via email before logging in.
    """
    supabase = get_supabase()
    try:
        result = supabase.auth.sign_up({"email": email, "password": password})
    except Exception as e:
        raise AuthError(_clean(str(e)))

    if result.user is None:
        raise AuthError("Could not create account. The email may already be in use.")

    # Store the nickname on the profile (profile row is created by a
    # Supabase trigger on auth.users; we upsert to set the nickname).
    if nickname:
        try:
            supabase.table("profiles").upsert(
                {"id": result.user.id, "email": email, "nickname": nickname.strip()},
            ).execute()
        except Exception:
            pass  # non-fatal; nickname can be set later in settings

    return {
        "user_id": result.user.id,
        "needs_confirmation": result.session is None,
    }


def sign_in(email: str, password: str) -> dict:
    """Authenticate. Returns {access_token, refresh_token}."""
    supabase = get_supabase()
    try:
        result = supabase.auth.sign_in_with_password(
            {"email": email, "password": password}
        )
    except Exception as e:
        raise AuthError(_clean(str(e)))

    if result.session is None:
        raise AuthError("Invalid email or password.")

    return {
        "access_token": result.session.access_token,
        "refresh_token": result.session.refresh_token,
    }


def refresh(refresh_token: str) -> dict:
    """Exchange a refresh token for a fresh access token."""
    supabase = get_supabase()
    try:
        result = supabase.auth.refresh_session(refresh_token)
    except Exception as e:
        raise AuthError(_clean(str(e)))

    if result.session is None:
        raise AuthError("Session expired. Please log in again.")

    return {
        "access_token": result.session.access_token,
        "refresh_token": result.session.refresh_token,
    }


def _clean(msg: str) -> str:
    """Keep error messages user-safe (don't leak internals) while still
    telling the user what actually went wrong."""
    lowered = msg.lower()
    if "already" in lowered and "registered" in lowered:
        return "That email is already registered. Try logging in."
    if "invalid" in lowered and "credential" in lowered:
        return "Invalid email or password."
    if "password" in lowered and ("weak" in lowered or "least" in lowered or "6 char" in lowered):
        return "Password is too weak. Use at least 6 characters."
    if "rate" in lowered or "too many" in lowered or "429" in lowered or "seconds" in lowered:
        return ("Too many attempts. Please wait a minute and try again.")
    if "email" in lowered and ("invalid" in lowered or "valid" in lowered):
        return "Please enter a valid email address."
    if "confirm" in lowered:
        return "Please confirm your email — check your inbox for the link."
    # Safe generic fallback — never echo raw provider text (it may contain
    # internal details).
    return "Sign-up failed. Please try again in a moment."
