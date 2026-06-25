"""Pydantic schemas package."""
from app.schemas.auth import (
    Token,
    TokenData,
    TokenResponse,
    UserBrief,
    UserCreate,
    UserLogin,
    LoginRequest,
    UserPublic,
    UserResponse,
    MessageResponse,
    SeedResponse,
)
from app.schemas.hosted_zone import (
    HostedZoneCreate,
    HostedZoneUpdate,
    # Primary names (spec-aligned)
    HostedZoneResponse,
    HostedZoneListResponse,
    # Backward-compat aliases
    HostedZonePublic,
    HostedZoneList,
)
from app.schemas.dns_record import (
    DnsRecordCreate,
    DnsRecordUpdate,
    DnsRecordPublic,
    DnsRecordList,
)

__all__ = [
    # Auth
    "Token",
    "TokenData",
    "TokenResponse",
    "UserBrief",
    "UserCreate",
    "UserLogin",
    "LoginRequest",
    "UserPublic",
    "UserResponse",
    "MessageResponse",
    "SeedResponse",
    # Hosted zones — primary names
    "HostedZoneCreate",
    "HostedZoneUpdate",
    "HostedZoneResponse",
    "HostedZoneListResponse",
    # Hosted zones — backward-compat aliases
    "HostedZonePublic",
    "HostedZoneList",
    # DNS records
    "DnsRecordCreate",
    "DnsRecordUpdate",
    "DnsRecordPublic",
    "DnsRecordList",
]
