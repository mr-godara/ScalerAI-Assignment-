from __future__ import annotations

import ipaddress
import json
import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.dns_record import RecordType, RoutingPolicy


def _is_valid_hostname(hostname: str) -> bool:
    if not hostname:
        return False
    if len(hostname) > 255:
        return False
    # allow trailing dot for absolute
    if hostname.endswith("."):
        hostname = hostname[:-1]
    allowed = re.compile(r"(?!-)[A-Z\d-]{1,63}(?<!-)$", re.IGNORECASE)
    return all(allowed.match(x) for x in hostname.split("."))


def validate_record_value(record_type: RecordType, values: list[str]) -> None:
    if record_type == RecordType.A:
        for val in values:
            try:
                ipaddress.IPv4Address(val)
            except ValueError:
                raise ValueError(f"Invalid IPv4 address: {val}")
    elif record_type == RecordType.AAAA:
        for val in values:
            try:
                ipaddress.IPv6Address(val)
            except ValueError:
                raise ValueError(f"Invalid IPv6 address: {val}")
    elif record_type == RecordType.CNAME:
        if len(values) != 1:
            raise ValueError("CNAME must have exactly 1 value")
        if not _is_valid_hostname(values[0]):
            raise ValueError(f"Invalid hostname for CNAME: {values[0]}")
    elif record_type == RecordType.TXT:
        for val in values:
            if not (val.startswith('"') and val.endswith('"')):
                raise ValueError("TXT values must be quoted strings")
            if len(val) > 255:
                raise ValueError("TXT values must not exceed 255 chars each")
    elif record_type == RecordType.MX:
        for val in values:
            parts = val.split(" ")
            if len(parts) != 2:
                raise ValueError(f"Invalid MX format: {val}")
            priority, hostname = parts
            if not priority.isdigit():
                raise ValueError(f"Invalid MX priority: {priority}")
            if not _is_valid_hostname(hostname):
                raise ValueError(f"Invalid MX hostname: {hostname}")
    elif record_type == RecordType.NS:
        for val in values:
            if not val.endswith("."):
                raise ValueError(f"NS target must end with a dot: {val}")
            if not _is_valid_hostname(val):
                raise ValueError(f"Invalid NS target: {val}")
    elif record_type == RecordType.PTR:
        for val in values:
            if not _is_valid_hostname(val):
                raise ValueError(f"Invalid PTR target: {val}")
    elif record_type == RecordType.SRV:
        for val in values:
            parts = val.split(" ")
            if len(parts) != 4:
                raise ValueError(f"Invalid SRV format: {val}")
            priority, weight, port, target = parts
            if not (priority.isdigit() and weight.isdigit() and port.isdigit()):
                raise ValueError(f"Invalid SRV numbers: {priority} {weight} {port}")
            if not _is_valid_hostname(target):
                raise ValueError(f"Invalid SRV target: {target}")
    elif record_type == RecordType.CAA:
        for val in values:
            parts = val.split(" ")
            if len(parts) < 3:
                raise ValueError(f"Invalid CAA format: {val}")
            flags = parts[0]
            if not flags.isdigit() or not (0 <= int(flags) <= 255):
                raise ValueError(f"Invalid CAA flags: {flags}")


class DnsRecordCreate(BaseModel):
    """Payload for POST /hosted-zones/{zone_id}/records."""

    name: str = Field(
        min_length=1,
        max_length=255,
        description="Record name (relative or absolute). '@' for apex.",
        examples=["www", "mail", "@"],
    )
    type: RecordType
    ttl: int = Field(default=300, ge=0, le=2_147_483_647)
    routing_policy: RoutingPolicy = RoutingPolicy.SIMPLE
    value: list[str] = Field(
        min_length=1,
        description="One or more record values (e.g. IP addresses, hostnames).",
    )
    alias: bool = False
    alias_target: str | None = None
    comment: str | None = Field(default=None, max_length=256)

    @field_validator("value", mode="before")
    @classmethod
    def coerce_value(cls, v: object) -> list[str]:
        """Accept a raw JSON string or a list of strings."""
        if isinstance(v, str):
            parsed = json.loads(v)
            if not isinstance(parsed, list):
                raise ValueError("value must be a JSON array of strings")
            return parsed
        return v  # type: ignore[return-value]

    @model_validator(mode="after")
    def validate_record(self) -> DnsRecordCreate:
        if self.alias:
            if not self.alias_target:
                raise ValueError("alias_target is required when alias=true")
        else:
            if not self.value:
                raise ValueError("value is required when alias=false")
            validate_record_value(self.type, self.value)
        return self


class DnsRecordUpdate(BaseModel):
    """Payload for PUT /hosted-zones/{zone_id}/records/{record_id}."""

    ttl: int | None = Field(default=None, ge=0, le=2_147_483_647)
    routing_policy: RoutingPolicy | None = None
    value: list[str] | None = None
    alias: bool | None = None
    alias_target: str | None = None
    comment: str | None = None

    @model_validator(mode="after")
    def validate_update(self) -> DnsRecordUpdate:
        if self.alias is True and not self.alias_target:
            raise ValueError("alias_target is required when alias=true")
        
        has_update = any(
            getattr(self, field) is not None
            for field in ("ttl", "routing_policy", "value", "alias", "alias_target", "comment")
        )
        if not has_update:
            raise ValueError("At least one field must be provided for update")
            
        return self


class DnsRecordPublic(BaseModel):
    """Full DNS record representation returned by the API."""

    id: str
    zone_id: str
    name: str
    type: RecordType
    ttl: int
    routing_policy: RoutingPolicy
    value: list[str]
    alias: bool
    alias_target: str | None
    comment: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("value", mode="before")
    @classmethod
    def parse_value(cls, v: object) -> list[str]:
        """Deserialise the JSON string stored in SQLite back to a list."""
        if isinstance(v, str):
            return json.loads(v)
        return v  # type: ignore[return-value]


class DnsRecordList(BaseModel):
    """Paginated list of DNS records."""

    records: list[DnsRecordPublic]
    total: int
    page: int
    page_size: int
    total_pages: int


class DnsRecordBulkDelete(BaseModel):
    record_ids: list[str]


class ImportResponse(BaseModel):
    imported: int
    skipped: int
    errors: list[str]

