"""Hosted zones router — /api/v1/hosted-zones."""
from __future__ import annotations

import math
import logging

from fastapi import APIRouter, HTTPException, Query, status

from app.dependencies import CurrentUserDep, DbDep
from app.schemas.hosted_zone import (
    HostedZoneCreate,
    HostedZoneListResponse,
    HostedZoneResponse,
    HostedZoneUpdate,
)
from app.services.zone_service import ZoneService
from app.utils.pagination import PaginationParams, paginate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hosted-zones", tags=["Hosted Zones"])

# ---------------------------------------------------------------------------
# RFC 7807 error templates
# ---------------------------------------------------------------------------

_ERR_NOT_FOUND = {
    "type": "https://route53.local/errors/not-found",
    "title": "Not Found",
    "status": 404,
}
_ERR_CONFLICT = {
    "type": "https://route53.local/errors/conflict",
    "title": "Conflict",
    "status": 409,
}


def _get_zone_or_404(db, zone_id: str, owner_id: str):
    zone = ZoneService.get_zone(db, zone_id, owner_id)
    if zone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                **_ERR_NOT_FOUND,
                "detail": f"Hosted zone '{zone_id}' not found",
            },
        )
    return zone


# ---------------------------------------------------------------------------
# POST /hosted-zones
# ---------------------------------------------------------------------------


@router.post(
    "",
    response_model=HostedZoneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new hosted zone",
    responses={
        409: {"description": "Zone name already exists for this account"},
        422: {"description": "Invalid domain name"},
    },
)
def create_hosted_zone(
    payload: HostedZoneCreate,
    db: DbDep,
    current_user: CurrentUserDep,
) -> HostedZoneResponse:
    """
    Create a hosted zone.

    - Auto-appends a trailing dot to ``name`` if missing.
    - Validates ``name`` against the RFC-compliant domain-name regex.
    - Auto-creates default NS and SOA records (record_count starts at 2).
    - Returns HTTP 409 if a zone with the same name already exists for this user.
    """
    try:
        zone = ZoneService.create_zone(db, payload, current_user.id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                **_ERR_CONFLICT,
                "detail": str(exc),
            },
        ) from exc

    return HostedZoneResponse.model_validate(zone)


# ---------------------------------------------------------------------------
# GET /hosted-zones
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=HostedZoneListResponse,
    summary="List hosted zones for the current user",
    responses={
        200: {"description": "Paginated list of hosted zones"},
    },
)
def list_hosted_zones(
    db: DbDep,
    current_user: CurrentUserDep,
    search: str | None = Query(
        default=None,
        description="Case-insensitive substring filter on zone name.",
        max_length=255,
    ),
    type: str | None = Query(
        default=None,
        description="Filter by zone type: PUBLIC or PRIVATE.",
        pattern="^(PUBLIC|PRIVATE)$",
    ),
    page: int = Query(default=1, ge=1, description="1-based page number."),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Number of results per page (max 100).",
    ),
) -> HostedZoneListResponse:
    """
    Return a paginated list of hosted zones owned by the authenticated user.

    Supports optional ``search`` (name contains, case-insensitive) and
    ``type`` (PUBLIC | PRIVATE) filters.
    """
    query = ZoneService.list_zones(
        db,
        owner_id=current_user.id,
        search=search,
        zone_type=type,
    )
    items, total = paginate(query, PaginationParams(page=page, page_size=page_size))
    total_pages = max(1, math.ceil(total / page_size))
    return HostedZoneListResponse(
        zones=[HostedZoneResponse.model_validate(z) for z in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ---------------------------------------------------------------------------
# GET /hosted-zones/{zone_id}
# ---------------------------------------------------------------------------


@router.get(
    "/{zone_id}",
    response_model=HostedZoneResponse,
    summary="Get a single hosted zone by ID",
    responses={
        404: {"description": "Zone not found or not owned by current user"},
    },
)
def get_hosted_zone(
    zone_id: str,
    db: DbDep,
    current_user: CurrentUserDep,
) -> HostedZoneResponse:
    """
    Retrieve a single hosted zone.

    - Returns HTTP 404 if the zone does not exist **or** belongs to another user.
    - Includes ``ns_records`` in the response (list of nameserver strings).
    """
    zone = _get_zone_or_404(db, zone_id, current_user.id)
    ns_records = ZoneService.get_zone_ns_records(db, zone_id)
    response = HostedZoneResponse.model_validate(zone)
    response.ns_records = ns_records
    return response


# ---------------------------------------------------------------------------
# PUT /hosted-zones/{zone_id}
# ---------------------------------------------------------------------------


@router.put(
    "/{zone_id}",
    response_model=HostedZoneResponse,
    summary="Update a hosted zone (comment and/or type)",
    responses={
        404: {"description": "Zone not found or not owned by current user"},
    },
)
def update_hosted_zone(
    zone_id: str,
    payload: HostedZoneUpdate,
    db: DbDep,
    current_user: CurrentUserDep,
) -> HostedZoneResponse:
    """
    Update mutable attributes of a hosted zone.

    - Only ``comment`` and ``type`` can be changed.
    - ``name`` is **immutable** after creation; any ``name`` field in the body
      is silently ignored.
    """
    zone = _get_zone_or_404(db, zone_id, current_user.id)
    zone = ZoneService.update_zone(db, zone, payload)
    return HostedZoneResponse.model_validate(zone)


# ---------------------------------------------------------------------------
# DELETE /hosted-zones/{zone_id}
# ---------------------------------------------------------------------------


@router.delete(
    "/{zone_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Delete a hosted zone and all its records",
    responses={
        204: {"description": "Zone deleted successfully"},
        404: {"description": "Zone not found or not owned by current user"},
        409: {"description": "Zone has active DNS records that must be deleted first"},
    },
)
def delete_hosted_zone(
    zone_id: str,
    db: DbDep,
    current_user: CurrentUserDep,
) -> None:
    """
    Delete a hosted zone.

    - Returns HTTP 409 if the zone contains more than the two default records
      (NS + SOA).  Delete all custom records first.
    - On success, cascades to delete all remaining DNS records and returns 204.
    """
    zone = _get_zone_or_404(db, zone_id, current_user.id)
    try:
        ZoneService.delete_zone(db, zone)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                **_ERR_CONFLICT,
                "detail": str(exc),
            },
        ) from exc
