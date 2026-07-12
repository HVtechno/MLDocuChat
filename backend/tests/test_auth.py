"""Tests for the auth error-message cleaner.

We can't hit Supabase in unit tests, but we CAN verify that raw provider
errors are turned into safe, friendly messages that don't leak internals.
"""
from app.services.auth import _clean


def test_already_registered_message():
    out = _clean("User already registered")
    assert "already registered" in out.lower()


def test_invalid_credentials_message():
    out = _clean("Invalid login credentials")
    assert out == "Invalid email or password."


def test_weak_password_message():
    out = _clean("Password should be at least 6 characters")
    assert "weak" in out.lower() or "6" in out


def test_unknown_error_is_generic_and_safe():
    out = _clean("some internal stack trace with secrets")
    assert "secret" not in out.lower()
    assert "failed" in out.lower()
