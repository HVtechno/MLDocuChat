"""Central configuration. Every env var is read here, once, and
validated at startup so the app fails fast with a clear message
instead of a confusing error deep in a request handler.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Supabase ---
    supabase_url: str
    supabase_service_key: str          # secret, backend only
    supabase_anon_key: str
    supabase_storage_bucket: str = "documents"

    # --- OpenAI ---
    openai_api_key: str
    embedding_model: str = "text-embedding-3-small"   # 1536 dims, cheap
    chat_model: str = "gpt-4o-mini"                    # agent reasoning + answers

    # --- Polar billing (merchant of record; handles EU VAT) ---
    # Optional until you add them — the app runs without, pricing still shows,
    # and checkout activates once these are set.
    polar_access_token: str = ""
    polar_webhook_secret: str = ""
    polar_product_id: str = ""
    polar_server: str = "sandbox"          # "sandbox" | "production"
    polar_success_url: str = "http://localhost:5173/chat?checkout=success"

    # --- Admin ---
    # Comma-separated emails allowed to see the admin panel.
    admin_emails: str = ""

    # --- App ---
    frontend_origin: str = "http://localhost:5173"     # for CORS
    environment: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Cached so we parse env only once per process."""
    return Settings()


def is_admin_email(email: str | None) -> bool:
    """True if the email is in ADMIN_EMAILS. Admins bypass plan limits."""
    if not email:
        return False
    admins = {e.strip().lower() for e in get_settings().admin_emails.split(",") if e.strip()}
    return email.lower() in admins
