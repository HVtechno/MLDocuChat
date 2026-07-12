"""Plan definitions and limit enforcement.

This is the SINGLE SOURCE OF TRUTH for what each plan allows. In v1
the Stripe checkout sold Basic/Pro/Plus while the validator defined
Free/Basic/Standard/Plus — so a paid tier had no limits at all. Here,
the same PLANS dict drives both Stripe pricing and upload enforcement,
so they can never drift apart.

Prices are in cents (EUR). Stripe reads `price_cents`; the uploader
reads the limits. Change a plan in one place, both stay in sync.
"""
from dataclasses import dataclass
from math import inf


@dataclass(frozen=True)
class Plan:
    key: str
    label: str
    price_cents: int          # monthly; 0 for free
    max_documents: int | float
    max_file_mb: int | float
    max_pages_per_file: int | float
    monthly_questions: int | float


PLANS: dict[str, Plan] = {
    "free": Plan(
        key="free", label="Free", price_cents=0,
        # Genuinely useful but clearly capped, so serious users upgrade.
        max_documents=3, max_file_mb=10, max_pages_per_file=30,
        monthly_questions=30,
    ),
    "pro": Plan(
        key="pro", label="Pro", price_cents=1200,   # €12/month
        # Effectively unlimited for an individual researcher.
        max_documents=500, max_file_mb=50, max_pages_per_file=inf,
        monthly_questions=inf,
    ),
}

DEFAULT_PLAN = "free"


def get_plan(plan_key: str | None) -> Plan:
    """Always returns a valid plan; unknown/None falls back to free."""
    return PLANS.get(plan_key or DEFAULT_PLAN, PLANS[DEFAULT_PLAN])


def check_file_allowed(plan_key: str, file_mb: float, pages: int) -> tuple[bool, str | None]:
    """Validate a single upload against the plan. Returns (ok, error)."""
    plan = get_plan(plan_key)
    if file_mb > plan.max_file_mb:
        return False, f"File exceeds the {plan.max_file_mb} MB limit on the {plan.label} plan."
    if pages > plan.max_pages_per_file:
        return False, f"File exceeds the {plan.max_pages_per_file}-page limit on the {plan.label} plan."
    return True, None
