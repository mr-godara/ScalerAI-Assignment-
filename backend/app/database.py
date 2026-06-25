from __future__ import annotations

from collections.abc import Generator
from typing import Any

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


# ── Engine ────────────────────────────────────────────────────────────────────

_connect_args: dict[str, Any] = (
    {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=_connect_args,
    # Pool settings — SQLite doesn't benefit from a large pool, but we keep
    # these here for documentation purposes; swap for PostgreSQL in production.
    pool_pre_ping=True,
)


# ── SQLite pragma hooks ───────────────────────────────────────────────────────

@event.listens_for(engine, "connect")
def _set_sqlite_pragmas(dbapi_connection: Any, _connection_record: Any) -> None:
    """Enable WAL mode and foreign-key enforcement on every new connection."""
    if settings.DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.execute("PRAGMA mmap_size=268435456")  # 256 MB
        cursor.close()


# ── Session factory ───────────────────────────────────────────────────────────

SessionLocal: sessionmaker[Session] = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# ── Declarative Base ──────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session and guarantees cleanup.

    Usage::

        @router.get("/items")
        def list_items(db: Session = Depends(get_db)) -> list[Item]:
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_database_connectivity() -> bool:
    """Probe the database; return True on success, False on failure."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
