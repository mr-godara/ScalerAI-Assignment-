import json
from typing import Tuple

import dns.zone
import dns.rdatatype

from sqlalchemy.orm import Session
from app.models.hosted_zone import HostedZone
from app.models.dns_record import RecordType, RoutingPolicy
from app.schemas.dns_record import DnsRecordCreate
from app.services.zone_service import ZoneService


class ZoneFileService:
    @staticmethod
    def parse_and_import_zone_file(
        db: Session, zone: HostedZone, file_content: str
    ) -> Tuple[int, int, list[str]]:
        imported = 0
        skipped = 0
        errors = []

        try:
            # Load the zone from text. Origin is the zone name.
            z = dns.zone.from_text(file_content, origin=zone.name, relativize=False)
        except Exception as e:
            errors.append(f"Failed to parse zone file: {e}")
            return 0, 0, errors

        for name, node in z.nodes.items():
            record_name = name.to_text()
            for rdataset in node.rdatasets:
                rtype = dns.rdatatype.to_text(rdataset.rdtype)

                try:
                    mapped_type = RecordType(rtype)
                except ValueError:
                    skipped += 1
                    errors.append(f"Unsupported record type skipped: {rtype} for {record_name}")
                    continue

                values = [rdata.to_text() for rdata in rdataset]

                if not values:
                    skipped += 1
                    continue

                # Skip default apex NS/SOA records since they are managed automatically
                if record_name == zone.name and mapped_type in (RecordType.SOA, RecordType.NS):
                    skipped += 1
                    continue

                payload = DnsRecordCreate(
                    name=record_name,
                    type=mapped_type,
                    ttl=rdataset.ttl,
                    routing_policy=RoutingPolicy.SIMPLE,
                    value=values,
                )

                try:
                    ZoneService.create_record(db, zone, payload)
                    imported += 1
                except ValueError as e:
                    skipped += 1
                    errors.append(f"Validation/Conflict error for {record_name} ({rtype}): {e}")

        return imported, skipped, errors

    @staticmethod
    def generate_zone_file(db: Session, zone: HostedZone) -> str:
        records_query = ZoneService.list_records(db, zone.id)
        records = records_query.all()

        lines = [f"$ORIGIN {zone.name}"]

        # Ensure SOA is printed first in standard BIND format.
        soa_record = next((r for r in records if r.type == RecordType.SOA), None)
        if soa_record:
            soa_vals = json.loads(soa_record.value)
            if soa_vals:
                lines.append(f"{soa_record.name} {soa_record.ttl} IN SOA {soa_vals[0]}")

        for r in records:
            if r.type == RecordType.SOA:
                continue
            vals = json.loads(r.value)
            for v in vals:
                lines.append(f"{r.name} {r.ttl} IN {r.type} {v}")

        return "\n".join(lines) + "\n"
