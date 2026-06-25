"""Business-logic layer for hosted zones and DNS records."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from sqlalchemy import event, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.dns_record import DnsRecord, RecordType, RoutingPolicy
from app.models.hosted_zone import HostedZone
from app.schemas.dns_record import DnsRecordCreate, DnsRecordUpdate
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneUpdate

logger = logging.getLogger(__name__)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# SQLAlchemy event listeners — keep record_count in sync automatically.
#
# Strategy: use the raw ``connection`` parameter exposed by the event hook to
# issue a direct UPDATE on hosted_zones.  This writes the new count to the
# actual DB row during the same transaction, so a subsequent ``db.refresh()``
# will see the correct value.  We cannot use plain ORM attribute assignment
# here because SQLAlchemy drops dirty-state changes made to clean instances
# inside inner-flush event handlers.
# ---------------------------------------------------------------------------

from sqlalchemy import text as _sa_text  # noqa: E402 (import at module level)


def _recount_zone_via_connection(
    connection: object,  # DBAPI connection from the event hook
    zone_id: str,
) -> None:
    """
    Issue a raw SQL UPDATE to set record_count on the zone row.

    Parameters
    ----------
    connection:
        The DBAPI connection passed by SQLAlchemy to after_insert / after_delete
        event hooks.
    zone_id:
        Primary key of the HostedZone to update.
    """
    # ``connection`` here is SQLAlchemy's Connection wrapper; we can execute
    # arbitrary SQL on it inside the ongoing transaction.
    from sqlalchemy import Connection as _Conn  # local import to avoid cycle
    conn: _Conn = connection  # type: ignore[assignment]
    conn.execute(
        _sa_text(
            "UPDATE hosted_zones "
            "SET record_count = ("
            "  SELECT COUNT(*) FROM dns_records WHERE zone_id = :zid"
            "), "
            "updated_at = :now "
            "WHERE id = :zid"
        ),
        {"zid": zone_id, "now": _utcnow().isoformat()},
    )


@event.listens_for(DnsRecord, "after_insert")
def _after_dns_record_insert(
    mapper: object,  # noqa: ANN001
    connection: object,  # noqa: ANN001
    target: DnsRecord,
) -> None:
    """After a DnsRecord INSERT, update the parent zone's record_count."""
    _recount_zone_via_connection(connection, target.zone_id)


@event.listens_for(DnsRecord, "after_delete")
def _after_dns_record_delete(
    mapper: object,  # noqa: ANN001
    connection: object,  # noqa: ANN001
    target: DnsRecord,
) -> None:
    """After a DnsRecord DELETE, update the parent zone's record_count."""
    _recount_zone_via_connection(connection, target.zone_id)


# ---------------------------------------------------------------------------
# Default NS nameservers (mock AWS-style values)
# ---------------------------------------------------------------------------

_DEFAULT_NS_VALUES: list[str] = [
    "ns-1.awsdns-01.com.",
    "ns-2.awsdns-02.net.",
    "ns-3.awsdns-03.org.",
    "ns-4.awsdns-04.co.uk.",
]


def _build_soa_value(zone_name: str) -> str:
    """Return a realistic SOA record value string."""
    return (
        f"ns-1.awsdns-01.com. awsdns-hostmaster.amazon.com. "
        f"1 7200 900 1209600 86400"
    )


def _create_default_records(db: Session, zone: HostedZone) -> None:
    """Auto-create NS and SOA records for a newly created zone."""
    ns_record = DnsRecord(
        zone_id=zone.id,
        name=zone.name,
        type=RecordType.NS,
        ttl=172800,  # 48 hours — AWS default for NS
        routing_policy=RoutingPolicy.SIMPLE,
        value=json.dumps(_DEFAULT_NS_VALUES),
        alias=False,
        alias_target=None,
        comment="Default NS record set (auto-created)",
    )
    soa_record = DnsRecord(
        zone_id=zone.id,
        name=zone.name,
        type=RecordType.SOA,
        ttl=900,
        routing_policy=RoutingPolicy.SIMPLE,
        value=json.dumps([_build_soa_value(zone.name)]),
        alias=False,
        alias_target=None,
        comment="Default SOA record (auto-created)",
    )
    db.add(ns_record)
    db.add(soa_record)


class ZoneService:
    """
    Business-logic layer for hosted zones and DNS records.
    All methods accept a SQLAlchemy ``Session`` as the first argument.
    """

    # ══════════════════════════════════════════════════════════════════════════
    # Hosted Zones
    # ══════════════════════════════════════════════════════════════════════════

    @staticmethod
    def create_zone(db: Session, payload: HostedZoneCreate, owner_id: str) -> HostedZone:
        """
        Create a hosted zone.

        - Raises ``ValueError`` on duplicate name for the same owner.
        - Auto-creates default NS and SOA records.
        - Sets record_count = 2 after default record creation.
        """
        existing = (
            db.query(HostedZone)
            .filter(HostedZone.name == payload.name, HostedZone.owner_id == owner_id)
            .first()
        )
        if existing:
            raise ValueError(
                f"A zone named '{payload.name}' already exists for this account"
            )

        zone = HostedZone(
            name=payload.name,
            type=payload.type,
            comment=payload.comment,
            owner_id=owner_id,
            record_count=0,  # will be updated by event listener after NS/SOA insert
        )
        db.add(zone)
        db.flush()  # get zone.id without committing

        # Create default NS and SOA records (event listeners will update record_count)
        _create_default_records(db, zone)
        db.flush()  # triggers after_insert events → record_count updated

        db.commit()
        db.refresh(zone)
        return zone

    @staticmethod
    def list_zones(
        db: Session,
        owner_id: str,
        search: str | None = None,
        zone_type: str | None = None,
    ):
        """
        Return the SQLAlchemy query for listing zones for the given owner.
        """
        base_q = db.query(HostedZone).filter(HostedZone.owner_id == owner_id)

        if search:
            base_q = base_q.filter(
                HostedZone.name.ilike(f"%{search.lower()}%")
            )

        if zone_type:
            base_q = base_q.filter(HostedZone.type == zone_type)

        return base_q.order_by(HostedZone.created_at.desc())

    @staticmethod
    def get_zone(db: Session, zone_id: str, owner_id: str) -> HostedZone | None:
        """Fetch a zone by ID, scoped to the requesting user."""
        return (
            db.query(HostedZone)
            .filter(HostedZone.id == zone_id, HostedZone.owner_id == owner_id)
            .first()
        )

    @staticmethod
    def get_zone_ns_records(db: Session, zone_id: str) -> list[str]:
        """Return the NS record values for a zone (list of nameserver strings)."""
        ns_record: DnsRecord | None = (
            db.query(DnsRecord)
            .filter(DnsRecord.zone_id == zone_id, DnsRecord.type == RecordType.NS)
            .first()
        )
        if ns_record is None:
            return []
        try:
            return json.loads(ns_record.value)
        except (json.JSONDecodeError, TypeError):
            return []

    @staticmethod
    def update_zone(
        db: Session,
        zone: HostedZone,
        payload: HostedZoneUpdate,
    ) -> HostedZone:
        """
        Update mutable zone fields (comment, type).
        Zone name is immutable after creation and is explicitly excluded.
        """
        update_data = payload.model_dump(exclude_unset=True, exclude={"name"})
        for field, value in update_data.items():
            if value is not None:
                setattr(zone, field, value)
        zone.updated_at = _utcnow()
        db.commit()
        db.refresh(zone)
        return zone

    @staticmethod
    def delete_zone(db: Session, zone: HostedZone) -> None:
        """
        Delete a hosted zone.

        Raises:
            ValueError: If the zone has more than 2 records (the default NS/SOA).
        """
        if zone.record_count > 2:
            raise ValueError(
                "Cannot delete hosted zone with active DNS records. "
                "Delete all records first."
            )
        db.delete(zone)
        db.commit()

    # ══════════════════════════════════════════════════════════════════════════
    # DNS Records
    # ══════════════════════════════════════════════════════════════════════════

    @staticmethod
    def create_record(
        db: Session,
        zone: HostedZone,
        payload: DnsRecordCreate,
    ) -> DnsRecord:
        """
        Create a DNS record inside a zone.
        The (name, zone_id, type) triple must be unique (enforced by DB constraint).
        record_count is updated automatically via the after_insert event listener.
        """
        record = DnsRecord(
            zone_id=zone.id,
            name=payload.name,
            type=payload.type,
            ttl=payload.ttl,
            routing_policy=payload.routing_policy,
            value=json.dumps(payload.value),
            alias=payload.alias,
            alias_target=payload.alias_target,
            comment=payload.comment,
        )
        db.add(record)
        try:
            db.flush()  # triggers after_insert → record_count updated
        except IntegrityError as exc:
            db.rollback()
            raise ValueError(
                f"A '{payload.type}' record for '{payload.name}' already exists in this zone"
            ) from exc

        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def list_records(
        db: Session,
        zone_id: str,
        record_type: str | None = None,
        search: str | None = None,
    ):
        from sqlalchemy import or_
        base_q = db.query(DnsRecord).filter(DnsRecord.zone_id == zone_id)
        if record_type:
            base_q = base_q.filter(DnsRecord.type == record_type)
        if search:
            base_q = base_q.filter(
                or_(
                    DnsRecord.name.ilike(f"%{search}%"),
                    DnsRecord.value.ilike(f"%{search}%")
                )
            )
        return base_q.order_by(DnsRecord.name, DnsRecord.type)

    @staticmethod
    def get_record(db: Session, record_id: str, zone_id: str) -> DnsRecord | None:
        return (
            db.query(DnsRecord)
            .filter(DnsRecord.id == record_id, DnsRecord.zone_id == zone_id)
            .first()
        )

    @staticmethod
    def update_record(
        db: Session,
        zone: HostedZone,
        record: DnsRecord,
        payload: DnsRecordUpdate,
    ) -> DnsRecord:
        update_data = payload.model_dump(exclude_unset=True)
        if "value" in update_data and update_data["value"] is not None:
            update_data["value"] = json.dumps(update_data["value"])
        for field, value in update_data.items():
            setattr(record, field, value)
        record.updated_at = _utcnow()
        zone.updated_at = _utcnow()
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def delete_record(db: Session, zone: HostedZone, record: DnsRecord) -> None:
        """
        Delete a DNS record.
        record_count is updated automatically via the after_delete event listener.
        """
        db.delete(record)
        db.flush()  # triggers after_delete → record_count updated
        zone.updated_at = _utcnow()
        db.commit()

    @staticmethod
    def bulk_delete_records(
        db: Session,
        zone: HostedZone,
        record_ids: list[str],
    ) -> int:
        """
        Delete multiple records by ID, skipping default NS and SOA records at the apex.
        """
        records_to_delete = (
            db.query(DnsRecord)
            .filter(DnsRecord.id.in_(record_ids), DnsRecord.zone_id == zone.id)
            .all()
        )
        
        deleted_count = 0
        for record in records_to_delete:
            if record.name == zone.name and record.type in (RecordType.NS, RecordType.SOA):
                continue
            db.delete(record)
            deleted_count += 1
            
        if deleted_count > 0:
            db.flush() # triggers after_delete event for each record
            zone.updated_at = _utcnow()
            db.commit()
            
        return deleted_count
