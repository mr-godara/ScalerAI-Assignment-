from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from app.config import settings
from app.dependencies import CurrentUserDep, DbDep
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    SeedResponse,
    Token,
    UserBrief,
    UserCreate,
    UserPublic,
)
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── POST /auth/register ───────────────────────────────────────────────────────


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register(payload: UserCreate, db: DbDep) -> UserPublic:
    """Create a new user.  Returns HTTP 409 if the email is already taken."""
    try:
        user = AuthService.register_user(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "type": "https://route53.local/errors/conflict",
                "title": "Conflict",
                "status": 409,
                "detail": str(exc),
            },
        ) from exc
    return UserPublic.model_validate(user)


# ── POST /auth/login ──────────────────────────────────────────────────────────


@router.post(
    "/login",
    response_model=Token,
    summary="Authenticate and receive a JWT access token",
    responses={
        401: {
            "description": "Invalid credentials",
            "content": {
                "application/json": {
                    "example": {
                        "type": "https://route53.local/errors/unauthorized",
                        "title": "Unauthorized",
                        "status": 401,
                        "detail": "Invalid email or password",
                    }
                }
            },
        }
    },
)
def login(payload: LoginRequest, db: DbDep) -> Token:
    """
    Authenticate with ``email`` + ``password``.

    Returns a signed JWT (HS256) that expires in 24 hours together with a
    brief user summary.  Pass the token in subsequent requests as:
    ``Authorization: Bearer <token>``
    """
    user = AuthService.authenticate(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "type": "https://route53.local/errors/unauthorized",
                "title": "Unauthorized",
                "status": 401,
                "detail": "Invalid email or password",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token, expires_in = AuthService.create_access_token(user)
    return Token(
        access_token=access_token,
        expires_in=expires_in,
        user=UserBrief.model_validate(user),
    )


# ── POST /auth/logout ─────────────────────────────────────────────────────────


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Acknowledge logout (client must discard token)",
    responses={
        401: {"description": "Missing or invalid Bearer token"},
    },
)
def logout(current_user: CurrentUserDep) -> MessageResponse:
    """
    Stateless logout — JWT is not server-side invalidated (no blocklist).
    The client **must** discard its stored token after receiving this response.

    Requires a valid ``Authorization: Bearer`` header.
    """
    logger.info("User %s logged out", current_user.email)
    return MessageResponse(message="Logged out")


# ── GET /auth/me ──────────────────────────────────────────────────────────────


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Return the currently authenticated user",
    responses={
        401: {"description": "Missing or invalid Bearer token"},
    },
)
def me(current_user: CurrentUserDep) -> UserPublic:
    """Return profile information for the token's owner."""
    return UserPublic.model_validate(current_user)


# ── POST /auth/seed ───────────────────────────────────────────────────────────


@router.post(
    "/seed",
    response_model=SeedResponse,
    status_code=status.HTTP_200_OK,
    summary="[DEV ONLY] Seed the demo admin user",
    include_in_schema=settings.ENVIRONMENT != "production",
    responses={
        403: {"description": "Not available in production"},
        200: {"description": "User seeded (or already existed)"},
    },
)
def seed(db: DbDep) -> SeedResponse:
    """
    Idempotently creates the demo admin account:

    - **email**: ``admin@route53.local``
    - **password**: ``Admin1234!``

    This endpoint is **disabled in production** (excluded from OpenAPI docs and
    returns HTTP 403).  Safe to call multiple times — re-seeding is a no-op.
    """
    if settings.ENVIRONMENT == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "type": "https://route53.local/errors/forbidden",
                "title": "Forbidden",
                "status": 403,
                "detail": "Seed endpoint is disabled in production",
            },
        )

    user, created = AuthService.seed_demo_user(db)
    action = "created" if created else "already exists"
    logger.info("Seed: demo user %s — %s", user.email, action)
    return SeedResponse(
        message=f"Demo user '{user.email}' {action}",
        user=UserBrief.model_validate(user),
    )
