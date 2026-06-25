from __future__ import annotations

import logging
import uuid
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.database import verify_database_connectivity
from app.routers import auth_router, dns_records_router, hosted_zones_router

logger = logging.getLogger(__name__)

# ── Lifespan ──────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown hooks."""
    # Startup
    logger.info("Starting %s …", settings.PROJECT_NAME)
    if not verify_database_connectivity():
        logger.error("Database connectivity check failed — check DATABASE_URL")
    else:
        logger.info("Database connection OK")
    yield
    # Shutdown
    logger.info("Shutting down %s", settings.PROJECT_NAME)


# ── App factory ───────────────────────────────────────────────────────────────


def create_app() -> FastAPI:
    app = FastAPI(
        title="Route53 Clone API",
        description="AWS Route53-compatible DNS management API",
        version="1.0.0",
        openapi_tags=[
            {"name": "Authentication", "description": "Authentication endpoints"},
            {"name": "Hosted Zones", "description": "Manage DNS hosted zones"},
            {"name": "DNS Records", "description": "Manage individual DNS records"}
        ],
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Middlewares ───────────────────────────────────────────────────────────
    
    @app.middleware("http")
    async def add_custom_headers(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Request-ID"] = str(uuid.uuid4())
        response.headers["X-RateLimit-Limit"] = "1000"
        response.headers["X-RateLimit-Remaining"] = "999"
        return response

    # ── Global exception handlers ─────────────────────────────────────────────

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        if isinstance(exc.detail, dict):
            content = exc.detail
        else:
            content = {"detail": exc.detail}
        return JSONResponse(
            status_code=exc.status_code,
            content=content,
            headers=getattr(exc, "headers", None)
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors = []
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error["loc"])
            errors.append({"field": field, "message": error["msg"]})
            
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": errors},
        )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
        logger.exception("Database error on %s %s", request.method, request.url)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "type": "https://route53.local/errors/database-error",
                "title": "Database Error",
                "status": 500,
                "detail": "A database error occurred",
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.exception("Unhandled error on %s %s", request.method, request.url)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "type": "https://route53.local/errors/internal-server-error",
                "title": "Internal Server Error",
                "status": 500,
                "detail": "An unexpected error occurred",
            },
        )

    # ── Routers ───────────────────────────────────────────────────────────────
    prefix = settings.API_V1_STR

    app.include_router(auth_router, prefix=prefix)
    app.include_router(hosted_zones_router, prefix=prefix)
    app.include_router(dns_records_router, prefix=prefix)

    # ── Health check ──────────────────────────────────────────────────────────

    @app.get("/health", tags=["Health"], summary="Liveness probe")
    async def health() -> dict[str, Any]:
        db_ok = verify_database_connectivity()
        return {
            "status": "ok" if db_ok else "degraded",
            "db": "connected" if db_ok else "unreachable",
            "version": "1.0.0",
        }

    return app


# ── ASGI entry point ──────────────────────────────────────────────────────────
app = create_app()
