from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.hosted_zone import HostedZone


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RecordType(StrEnum):
    A = "A"
    AAAA = "AAAA"
    CNAME = "CNAME"
    TXT = "TXT"
    MX = "MX"
    NS = "NS"
    SOA = "SOA"
    PTR = "PTR"
    SRV = "SRV"
    CAA = "CAA"


class RoutingPolicy(StrEnum):
    SIMPLE = "Simple"
    WEIGHTED = "Weighted"
    LATENCY = "Latency"
    FAILOVER = "Failover"
    GEOLOCATION = "Geolocation"
    MULTIVALUE = "Multivalue"


class DnsRecord(Base):
    """
    A single DNS resource record set inside a hosted zone.

    ``value`` is stored as a JSON array of strings to support multi-value
    records (e.g. multiple A record IPs).  Use ``json.loads`` / ``json.dumps``
    when reading/writing this column from application code.
    """

    __tablename__ = "dns_records"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    # ── Foreign key ───────────────────────────────────────────────────────────
    zone_id: Mapped[str] = mapped_column(
        String(15),
        ForeignKey("hosted_zones.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Record fields ─────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    ttl: Mapped[int] = mapped_column(Integer, nullable=False, default=300)
    routing_policy: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=RoutingPolicy.SIMPLE,
    )

    # Stored as JSON array string, e.g. '["1.2.3.4", "5.6.7.8"]'
    value: Mapped[str] = mapped_column(Text, nullable=False)

    # ── Alias fields ──────────────────────────────────────────────────────────
    alias: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    alias_target: Mapped[str | None] = mapped_column(Text, nullable=True)

    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

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
    zone: Mapped[HostedZone] = relationship("HostedZone", back_populates="dns_records")

    # ── Table args ────────────────────────────────────────────────────────────
    __table_args__ = (
        # A given (name, type) combination must be unique within a zone.
        UniqueConstraint("name", "zone_id", "type", name="uq_dns_record_name_zone_type"),
        Index("ix_dns_records_zone_id", "zone_id"),
        Index("ix_dns_records_type", "type"),
        Index("ix_dns_records_name_zone_id", "name", "zone_id"),
    )

    def __repr__(self) -> str:
        return (
            f"<DnsRecord id={self.id!r} zone_id={self.zone_id!r} "
            f"name={self.name!r} type={self.type!r}>"
        )
