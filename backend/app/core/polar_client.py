"""Polar billing client + configuration.

Polar is a Merchant of Record: it is the legal seller and handles VAT/tax
globally, so no company tax registration is needed on our side. This
centralizes the Polar access token, product id, webhook secret, server
(sandbox|production), and success URL.

Everything is optional: if the token/product id aren't set, `polar_configured()`
returns False and the billing routes report that cleanly — the app still runs,
the pricing page still shows, and checkout activates once the env vars are set.

Env vars (.env):
  POLAR_ACCESS_TOKEN=polar_...
  POLAR_WEBHOOK_SECRET=...
  POLAR_PRODUCT_ID=...
  POLAR_SERVER=sandbox            # sandbox (testing) | production
  POLAR_SUCCESS_URL=https://your-app/chat?checkout=success
"""
from app.config import get_settings

_settings = get_settings()


def _server() -> str:
    return "production" if _settings.polar_server.strip().lower() == "production" else "sandbox"


def polar_configured() -> bool:
    """True only when we have enough to create a checkout."""
    return bool(_settings.polar_access_token and _settings.polar_product_id)


def get_polar():
    """Build a Polar SDK client for the configured environment. Imported
    lazily so the app doesn't require the polar-sdk package unless billing
    is actually used."""
    if not _settings.polar_access_token:
        raise RuntimeError("Polar is not configured (POLAR_ACCESS_TOKEN missing).")
    from polar_sdk import Polar
    return Polar(access_token=_settings.polar_access_token, server=_server())


# Re-exported for the routes
POLAR_PRODUCT_ID = _settings.polar_product_id
POLAR_SUCCESS_URL = _settings.polar_success_url
POLAR_WEBHOOK_SECRET = _settings.polar_webhook_secret
