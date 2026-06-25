"""Pydantic schemas for hosted zones."""
from __future__ import annotations

import math
import re
from datetime import datetime

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.hosted_zone import ZoneType

# ---------------------------------------------------------------------------
# RFC-compliant domain-name regex
# Allows labels separated by dots; the trailing dot is optional in raw input
# but will be normalised to always be present after validation.
# ---------------------------------------------------------------------------
_DOMAIN_RE = re.compile(
    r"^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\.?$"
)


class HostedZoneCreate(BaseModel):
    """Payload for POST /hosted-zones."""

    name: str = Field(
        min_length=3,
        max_length=255,
        description=(
            "Fully-qualified domain name.  A trailing dot is auto-appended "
            "if missing (e.g. 'example.com' → 'example.com.')."
        ),
        examples=["example.com", "example.com."],
    )
    type: ZoneType = ZoneType.PUBLIC
    comment: str | None = Field(default=None, max_length=256)

    @field_validator("name")
    @classmethod
    def validate_and_normalise_name(cls, v: str) -> str:
        # Normalise to lowercase before regex check
        normalised = v.lower().rstrip(".")
        full = normalised + "."  # temporary for regex

        if not _DOMAIN_RE.match(full):
            raise ValueError(
                f"'{v}' is not a valid domain name.  "
                "Expected format: labels separated by dots (e.g. 'example.com')."
            )

        return full  # always ends with "."


class HostedZoneUpdate(BaseModel):
    """Payload for PUT /hosted-zones/{zone_id}.  Name cannot be changed."""

    comment: str | None = Field(default=None, max_length=256)
    type: ZoneType | None = None


class NsRecord(BaseModel):
    """Minimal representation of an NS record value."""

    value: str


class HostedZoneResponse(BaseModel):
    """Full hosted-zone representation returned by the API."""

    id: str
    name: str
    type: ZoneType
    comment: str | None
    record_count: int
    created_at: datetime
    updated_at: datetime
    # Populated only on GET /hosted-zones/{zone_id}
    ns_records: list[str] | None = None

    model_config = {"from_attributes": True}


# Keep the old alias so existing imports don't break
HostedZonePublic = HostedZoneResponse


class HostedZoneListResponse(BaseModel):
    """Paginated list response for GET /hosted-zones."""

    zones: list[HostedZoneResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Keep old alias for any import that uses HostedZoneList
HostedZoneList = HostedZoneListResponse
