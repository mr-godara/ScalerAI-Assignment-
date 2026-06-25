from __future__ import annotations

import random
import string
from datetime import datetime, timezone
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.dns_record import DnsRecord


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ZoneType(StrEnum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"


def _generate_zone_id() -> str:
    """
    Generate an AWS-style hosted zone ID: 'Z' + 14 uppercase alphanumeric chars.
    Example: Z1D633PJN98FT9
    """
    chars = string.ascii_uppercase + string.digits
    return "Z" + "".join(random.choices(chars, k=14))


class HostedZone(Base):
    """
    A hosted zone groups DNS records for a domain.
    The ``name`` field must be fully-qualified (i.e. end with a dot).
    """

    __tablename__ = "hosted_zones"

    id: Mapped[str] = mapped_column(
        String(15),
        primary_key=True,
        default=_generate_zone_id,
    )
    name: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    type: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default=ZoneType.PUBLIC,
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    record_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # ── Foreign keys ──────────────────────────────────────────────────────────
    owner_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
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
    owner: Mapped[User] = relationship("User", back_populates="hosted_zones")
    dns_records: Mapped[list[DnsRecord]] = relationship(
        "DnsRecord",
        back_populates="zone",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # ── Table args ────────────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_hosted_zones_owner_id", "owner_id"),
        Index("ix_hosted_zones_name", "name"),
    )

    def __repr__(self) -> str:
        return (
            f"<HostedZone id={self.id!r} name={self.name!r} type={self.type!r}>"
        )
