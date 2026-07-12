"""Supabase client construction.

Two clients, deliberately separate:

- get_supabase(): the general client for DB + storage. Note that calling
  auth.get_user(token) on a client attaches that user's session to it,
  downgrading its privileges. Since this is cached, we must NOT rely on it
  for admin operations after any user verification has happened.

- get_admin_supabase(): a FRESH client used only for privileged admin
  operations (e.g. auth.admin.delete_user). It never has a user session
  attached, so it always acts with full service-role authority. This
  fixes the "User not allowed" error that occurs when the shared client's
  session has been downgraded by token verification.
"""
from functools import lru_cache
from supabase import create_client, Client

from app.config import get_settings


@lru_cache
def get_supabase() -> Client:
    settings = get_settings()
    return create_client(
        settings.supabase_url,
        settings.supabase_service_key,
    )


def get_admin_supabase() -> Client:
    """A fresh, un-sessioned service-role client for admin operations.
    Not cached — we want a clean client with no user session ever attached.
    """
    settings = get_settings()
    return create_client(
        settings.supabase_url,
        settings.supabase_service_key,
    )
