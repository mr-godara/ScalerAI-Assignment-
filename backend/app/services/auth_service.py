from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.schemas.auth import TokenData, UserCreate

# ── Module-level password helpers (spec aliases) ──────────────────────────────


def get_password_hash(plain: str) -> str:
    """Hash a plaintext password with bcrypt (work factor 12)."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time bcrypt comparison. Returns False on any error."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(
    data: dict[str, object],
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a signed JWT from an arbitrary payload dict.

    Args:
        data: Claims to embed (must include ``"sub"``).
        expires_delta: Override the default expiry window.

    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Return the User if credentials are valid, else None.
    Delegates to ``AuthService.authenticate``.
    """
    return AuthService.authenticate(db, email, password)


# ── AuthService class ─────────────────────────────────────────────────────────


class AuthService:
    """
    Stateless auth service.  All methods are classmethods — no instantiation needed.
    Handles password hashing, verification, JWT creation/decoding, and user CRUD.
    """

    # ── Password helpers ──────────────────────────────────────────────────────

    @staticmethod
    def hash_password(plain: str) -> str:
        return get_password_hash(plain)

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        return verify_password(plain, hashed)

    # ── JWT helpers ───────────────────────────────────────────────────────────

    @staticmethod
    def create_access_token(user: User) -> tuple[str, int]:
        """
        Return (encoded_jwt, expires_in_seconds).
        Token lifetime is governed by ``ACCESS_TOKEN_EXPIRE_MINUTES`` in settings.
        """
        expire_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        token = create_access_token(
            data={"sub": user.id, "email": user.email},
            expires_delta=expire_delta,
        )
        return token, int(expire_delta.total_seconds())

    @staticmethod
    def decode_token(token: str) -> TokenData:
        """
        Decode and validate a JWT.  Raises ``JWTError`` on failure.
        """
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id: str | None = payload.get("sub")
        email: str | None = payload.get("email")
        if user_id is None or email is None:
            raise JWTError("Token payload missing required claims")
        return TokenData(user_id=user_id, email=email)

    # ── Database operations ───────────────────────────────────────────────────

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email.lower()).first()

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> User | None:
        return db.get(User, user_id)

    @classmethod
    def register_user(cls, db: Session, payload: UserCreate) -> User:
        """
        Create a new user.  Raises ``ValueError`` if the email already exists.
        """
        existing = cls.get_user_by_email(db, payload.email)
        if existing:
            raise ValueError(f"Email '{payload.email}' is already registered")

        user = User(
            email=payload.email.lower(),
            password_hash=cls.hash_password(payload.password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @classmethod
    def authenticate(cls, db: Session, email: str, password: str) -> User | None:
        """
        Return the User if credentials are valid, else None.

        Performs a dummy hash when the user doesn't exist to prevent timing
        attacks from distinguishing "no such user" from "wrong password".
        """
        user = cls.get_user_by_email(db, email)
        if user is None:
            # Constant-time dummy work — discard result
            bcrypt.checkpw(b"dummy", bcrypt.hashpw(b"dummy", bcrypt.gensalt()))
            return None
        if not cls.verify_password(password, user.password_hash):
            return None
        return user

    @classmethod
    def seed_demo_user(
        cls,
        db: Session,
        email: str = "admin@route53.local",
        password: str = "Admin1234!",
    ) -> tuple[User, bool]:
        """
        Idempotently create the demo admin user.

        Returns:
            (user, created) — ``created`` is False if the user already existed.
        """
        existing = cls.get_user_by_email(db, email)
        if existing:
            return existing, False

        user = User(
            email=email.lower(),
            password_hash=cls.hash_password(password),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, True
