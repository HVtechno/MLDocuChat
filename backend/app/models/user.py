"""Request/response shapes for auth and the current user."""
from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    nickname: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MeOut(BaseModel):
    id: str
    email: str | None = None
    plan: str = "free"
    nickname: str | None = None
    profession: str | None = None


class ProfileUpdate(BaseModel):
    nickname: str | None = None
    profession: str | None = None   # researcher | student | professional | other
