"""Initial schema — users, hosted_zones, dns_records

Revision ID: 0001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── hosted_zones ───────────────────────────────────────────────────────
    op.create_table(
        "hosted_zones",
        sa.Column("id", sa.String(15), primary_key=True, nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("type", sa.String(10), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("record_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("owner_id", sa.String(36), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_hosted_zones_owner_id", "hosted_zones", ["owner_id"])
    op.create_index("ix_hosted_zones_name", "hosted_zones", ["name"])

    # ── dns_records ────────────────────────────────────────────────────────
    op.create_table(
        "dns_records",
        sa.Column("id", sa.String(36), primary_key=True, nullable=False),
        sa.Column("zone_id", sa.String(15), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("type", sa.String(10), nullable=False),
        sa.Column("ttl", sa.Integer(), nullable=False, server_default="300"),
        sa.Column("routing_policy", sa.String(20), nullable=False, server_default="Simple"),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("alias", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("alias_target", sa.Text(), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["zone_id"], ["hosted_zones.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("name", "zone_id", "type", name="uq_dns_record_name_zone_type"),
    )
    op.create_index("ix_dns_records_zone_id", "dns_records", ["zone_id"])
    op.create_index("ix_dns_records_type", "dns_records", ["type"])
    op.create_index("ix_dns_records_name_zone_id", "dns_records", ["name", "zone_id"])


def downgrade() -> None:
    op.drop_table("dns_records")
    op.drop_table("hosted_zones")
    op.drop_table("users")
