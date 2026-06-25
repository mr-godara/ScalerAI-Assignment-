from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.hosted_zone import HostedZone


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    """
    Application user.  Passwords are stored as bcrypt hashes — never plaintext.
    """

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    email: Mapped[str] = mapped_column(
        Text,
        unique=True,
        nullable=False,
        index=True,
    )
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
        server_default=func.now(),
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    hosted_zones: Mapped[list[HostedZone]] = relationship(
        "HostedZone",
        back_populates="owner",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # ── Helpers ───────────────────────────────────────────────────────────────
    def __repr__(self) -> str:
        return f"<User id={self.id!r} email={self.email!r}>"
