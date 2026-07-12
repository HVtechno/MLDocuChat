"""Tests for plan definitions and enforcement.

These guard the v1 bug where Stripe plans and enforcement limits drifted
apart. If someone adds a plan to Stripe without limits (or vice versa),
these fail.
"""
from app.services.billing import PLANS, get_plan, check_file_allowed, DEFAULT_PLAN


def test_default_plan_exists():
    assert DEFAULT_PLAN in PLANS


def test_unknown_plan_falls_back_to_free():
    assert get_plan("does-not-exist").key == "free"
    assert get_plan(None).key == "free"


def test_every_plan_has_price_and_limits():
    # No plan may be sold without defined limits (the v1 failure).
    for plan in PLANS.values():
        assert plan.price_cents >= 0
        assert plan.max_documents is not None
        assert plan.max_file_mb is not None
        assert plan.max_pages_per_file is not None


def test_free_plan_rejects_oversized_file():
    ok, err = check_file_allowed("free", file_mb=99, pages=10)
    assert ok is False
    assert "MB" in err


def test_free_plan_rejects_too_many_pages():
    ok, err = check_file_allowed("free", file_mb=1, pages=9999)
    assert ok is False
    assert "page" in err


def test_free_plan_accepts_small_file():
    ok, err = check_file_allowed("free", file_mb=2, pages=10)
    assert ok is True
    assert err is None


def test_pro_plan_has_no_page_limit():
    ok, err = check_file_allowed("pro", file_mb=50, pages=5000)
    assert ok is True
