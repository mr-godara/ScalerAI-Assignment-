from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService

_bearer = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """
    FastAPI dependency that validates the Bearer JWT and returns the active User.

    Raises HTTP 401 with RFC 7807 body on any auth failure.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "type": "https://route53.local/errors/unauthorized",
            "title": "Unauthorized",
            "status": 401,
            "detail": "Could not validate credentials",
        },
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token_data = AuthService.decode_token(credentials.credentials)
    except JWTError:
        raise credentials_exception

    user = AuthService.get_user_by_id(db, token_data.user_id)
    if user is None:
        raise credentials_exception
    return user


# Convenience type aliases for injection
DbDep = Annotated[Session, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]
