"""Auth endpoints. Thin wrappers over the auth service, plus /me which
returns the current user with their plan.
"""
from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_current_user
from app.core.supabase_client import get_supabase
from app.models.user import SignupRequest, LoginRequest, AuthTokens, MeOut, ProfileUpdate
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup")
async def signup(req: SignupRequest):
    try:
        result = auth_service.sign_up(req.email, req.password, req.nickname)
    except auth_service.AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if result["needs_confirmation"]:
        return {
            "message": "Account created. Please check your email to confirm, "
            "then log in.",
            "needs_confirmation": True,
        }
    return {"message": "Account created.", "needs_confirmation": False}


@router.post("/login", response_model=AuthTokens)
async def login(req: LoginRequest):
    try:
        tokens = auth_service.sign_in(req.email, req.password)
    except auth_service.AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return tokens


@router.post("/refresh", response_model=AuthTokens)
async def refresh(refresh_token: str):
    try:
        tokens = auth_service.refresh(refresh_token)
    except auth_service.AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    return tokens


@router.get("/me", response_model=MeOut)
async def me(user=Depends(get_current_user)):
    supabase = get_supabase()
    profile = (
        supabase.table("profiles")
        .select("plan, nickname, profession")
        .eq("id", user["id"])
        .single()
        .execute()
    )
    data = profile.data or {}
    return {
        "id": user["id"],
        "email": user.get("email"),
        "plan": data.get("plan", "free"),
        "nickname": data.get("nickname"),
        "profession": data.get("profession"),
    }


@router.patch("/profile", response_model=MeOut)
async def update_profile(req: ProfileUpdate, user=Depends(get_current_user)):
    """Update nickname and/or profession. Profession drives research mode."""
    supabase = get_supabase()
    updates = {}
    if req.nickname is not None:
        updates["nickname"] = req.nickname.strip()
    if req.profession is not None:
        updates["profession"] = req.profession
    if updates:
        supabase.table("profiles").update(updates).eq("id", user["id"]).execute()

    profile = (
        supabase.table("profiles")
        .select("plan, nickname, profession")
        .eq("id", user["id"]).single().execute()
    )
    data = profile.data or {}
    return {
        "id": user["id"],
        "email": user.get("email"),
        "plan": data.get("plan", "free"),
        "nickname": data.get("nickname"),
        "profession": data.get("profession"),
    }
