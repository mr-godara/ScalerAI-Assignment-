from __future__ import annotations

import math

from fastapi import APIRouter, HTTPException, Query, status

from app.dependencies import CurrentUserDep, DbDep
from app.schemas.dns_record import (
    DnsRecordCreate,
    DnsRecordList,
    DnsRecordPublic,
    DnsRecordUpdate,
    DnsRecordBulkDelete,
    validate_record_value,
)
from app.models.dns_record import RecordType
from app.services.zone_service import ZoneService
from app.utils.pagination import PaginationParams, paginate

router = APIRouter(
    prefix="/hosted-zones/{zone_id}/records",
    tags=["DNS Records"],
)

_NOT_FOUND = {
    "type": "https://route53.local/errors/not-found",
    "title": "Not Found",
    "status": 404,
}


def _get_zone_or_404(db, zone_id: str, owner_id: str):
    zone = ZoneService.get_zone(db, zone_id, owner_id)
    if zone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={**_NOT_FOUND, "detail": f"Hosted zone '{zone_id}' not found"},
        )
    return zone


def _get_record_or_404(db, record_id: str, zone_id: str):
    record = ZoneService.get_record(db, record_id, zone_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={**_NOT_FOUND, "detail": f"DNS record '{record_id}' not found"},
        )
    return record


@router.post(
    "",
    response_model=DnsRecordPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create a DNS record in a hosted zone",
)
def create_dns_record(
    zone_id: str,
    payload: DnsRecordCreate,
    db: DbDep,
    current_user: CurrentUserDep,
) -> DnsRecordPublic:
    zone = _get_zone_or_404(db, zone_id, current_user.id)
    try:
        record = ZoneService.create_record(db, zone, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "type": "https://route53.local/errors/conflict",
                "title": "Conflict",
                "status": 409,
                "detail": str(exc),
            },
        ) from exc
    return DnsRecordPublic.model_validate(record)


@router.get(
    "",
    response_model=DnsRecordList,
    summary="List DNS records in a hosted zone",
)
def list_dns_records(
    zone_id: str,
    db: DbDep,
    current_user: CurrentUserDep,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=300),
    type: str | None = Query(default=None, description="Filter by record type (A, CNAME, …)"),
    search: str | None = Query(default=None, description="Filter by name or value"),
) -> DnsRecordList:
    _get_zone_or_404(db, zone_id, current_user.id)
    query = ZoneService.list_records(db, zone_id, type, search)
    items, total = paginate(query, PaginationParams(page=page, page_size=page_size))
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return DnsRecordList(
        records=[DnsRecordPublic.model_validate(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post(
    "/bulk-delete",
    status_code=status.HTTP_200_OK,
    summary="Bulk delete DNS records",
)
def bulk_delete_records(
    zone_id: str,
    payload: DnsRecordBulkDelete,
    db: DbDep,
    current_user: CurrentUserDep,
) -> dict:
    zone = _get_zone_or_404(db, zone_id, current_user.id)
    deleted_count = ZoneService.bulk_delete_records(db, zone, payload.record_ids)
    return {"deleted_count": deleted_count}


@router.get(
    "/{record_id}",
    response_model=DnsRecordPublic,
    summary="Get a single DNS record",
)
def get_dns_record(
    zone_id: str,
    record_id: str,
    db: DbDep,
    current_user: CurrentUserDep,
) -> DnsRecordPublic:
    _get_zone_or_404(db, zone_id, current_user.id)
    record = _get_record_or_404(db, record_id, zone_id)
    return DnsRecordPublic.model_validate(record)


@router.put(
    "/{record_id}",
    response_model=DnsRecordPublic,
    summary="Update a DNS record",
)
def update_dns_record(
    zone_id: str,
    record_id: str,
    payload: DnsRecordUpdate,
    db: DbDep,
    current_user: CurrentUserDep,
) -> DnsRecordPublic:
    zone = _get_zone_or_404(db, zone_id, current_user.id)
    record = _get_record_or_404(db, record_id, zone_id)
    
    if payload.value is not None:
        try:
            validate_record_value(record.type, payload.value)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "type": "https://route53.local/errors/validation-error",
                    "title": "Validation Error",
                    "status": 422,
                    "detail": str(exc),
                },
            ) from exc

    record = ZoneService.update_record(db, zone, record, payload)
    return DnsRecordPublic.model_validate(record)


@router.delete(
    "/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Delete a DNS record",
)
def delete_dns_record(
    zone_id: str,
    record_id: str,
    db: DbDep,
    current_user: CurrentUserDep,
) -> None:
    zone = _get_zone_or_404(db, zone_id, current_user.id)
    record = _get_record_or_404(db, record_id, zone_id)
    
    if record.name == zone.name and record.type in (RecordType.NS, RecordType.SOA):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "type": "https://route53.local/errors/bad-request",
                "title": "Bad Request",
                "status": 400,
                "detail": "Cannot delete default NS or SOA records",
            },
        )
        
    ZoneService.delete_record(db, zone, record)
