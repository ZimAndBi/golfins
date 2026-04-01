"""
Auth Service - Main Application
Location: services/auth-service/main.py
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime
import time
import os

from app.core.config import settings
from app.core.database import engine, init_db, close_db
from app.api.auth import router as auth_router
from app.models.user import Base

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown"""
    # Startup
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.SERVICE_VERSION}")

    try:
        await init_db()
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.SERVICE_NAME}")
    try:
        await close_db()
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")


# Create FastAPI app
app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.SERVICE_VERSION,
    description="Auth Service - User registration, login, token management",
    openapi_url="/docs/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    start_time = time.time()
    request_id = request.headers.get("X-Request-ID", str(time.time()))

    logger.info(
        f"[{request_id}] {request.method} {request.url.path}",
        extra={"method": request.method, "path": request.url.path}
    )

    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error(f"[{request_id}] Request failed: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

    process_time = time.time() - start_time
    logger.info(
        f"[{request_id}] {request.method} {request.url.path} - {response.status_code}",
        extra={"status_code": response.status_code, "process_time": process_time}
    )

    response.headers["X-Request-Id"] = request_id
    response.headers["X-Process-Time"] = str(process_time)

    return response


# Health check
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
    }


# Ready check
@app.get("/ready", tags=["Health"])
async def ready_check():
    """Ready check endpoint"""
    try:
        # Test database connection
        from sqlalchemy import text
        from app.core.database import SessionLocal

        async with SessionLocal() as session:
            await session.execute(text("SELECT 1"))

        return {
            "status": "ready",
            "service": settings.SERVICE_NAME,
            "dependencies": {"database": "ok"}
        }
    except Exception as e:
        logger.error(f"Ready check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "service": settings.SERVICE_NAME,
                "error": str(e)
            }
        )


# Include routers
app.include_router(auth_router)


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
