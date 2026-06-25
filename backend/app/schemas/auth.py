from __future__ import annotations

import re
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, field_validator, BeforeValidator


# ── Custom email type — accepts non-public TLDs (e.g. .local, .internal) ──────

_EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z0-9\-]{1,63}$")


def _validate_email(v: object) -> str:
    if not isinstance(v, str):
        raise ValueError("Email must be a string")
    v = v.strip().lower()
    if not _EMAIL_RE.match(v):
        raise ValueError(f"'{v}' is not a valid email address")
    return v


# Annotated email type: validates format, lowercases, accepts any TLD
EmailField = Annotated[str, BeforeValidator(_validate_email)]


# ── User schemas ──────────────────────────────────────────────────────────────


class UserCreate(BaseModel):
    """Payload for POST /auth/register."""

    email: EmailField
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    """Payload for POST /auth/login."""

    email: EmailField
    password: str


# Spec alias: LoginRequest → UserLogin
LoginRequest = UserLogin


class UserPublic(BaseModel):
    """Safe user representation — no password hash."""

    id: str
    email: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# Spec alias: UserResponse → UserPublic
UserResponse = UserPublic


class UserBrief(BaseModel):
    """Minimal user info embedded in token responses."""

    id: str
    email: str

    model_config = {"from_attributes": True}


# ── Token schemas ─────────────────────────────────────────────────────────────


class Token(BaseModel):
    """JWT response payload — mirrors spec's TokenResponse shape."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserBrief


# Spec alias: TokenResponse → Token
TokenResponse = Token


class TokenData(BaseModel):
    """Decoded JWT claims (used internally by get_current_user)."""

    user_id: str
    email: str


# ── Misc ──────────────────────────────────────────────────────────────────────


class MessageResponse(BaseModel):
    """Generic single-field message response (e.g. logout)."""

    message: str


class SeedResponse(BaseModel):
    """Response from POST /auth/seed."""

    message: str
    user: UserBrief
