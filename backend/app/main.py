"""FastAPI application entry point.

Routers are registered here but kept thin — all real logic lives in
services/. Steps 2-6 will fill in the router modules; for now the app
boots, serves a health check, and has CORS wired for the React dev
server.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: validating settings early surfaces missing env vars now,
    # not on the first request.
    get_settings()
    yield
    # Shutdown: nothing to clean up yet.


app = FastAPI(title="Foliq API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "environment": settings.environment}


# --- routers ---
from app.routers import auth, documents, chat, account  # noqa: E402
from app.routers import polar_billing, feedback_admin  # noqa: E402

app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(account.router)
app.include_router(polar_billing.router)
app.include_router(feedback_admin.router)

# Added in later steps:
# from app.routers import billing
# app.include_router(billing.router)
