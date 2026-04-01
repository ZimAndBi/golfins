"""
Base FastAPI Application Template
Location: services/{service-name}/main.py (Example: auth-service)
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import time
from datetime import datetime

# Environment and Config
import sys
sys.path.insert(0, '/app/shared')

from core.config import settings, get_settings
from core.database import engine, SessionLocal
from models.base import Base

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.SERVICE_VERSION}")

    # Create database tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Database tables created/verified")

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.SERVICE_NAME}")
    await engine.dispose()

# Create FastAPI application
app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.SERVICE_VERSION,
    description=f"{settings.SERVICE_NAME} - Production Ready Microservice",
    openapi_url="/docs/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests and responses"""
    start_time = time.time()
    request_id = request.headers.get("X-Request-ID", str(time.time()))

    # Log request
    logger.info(
        f"[{request_id}] {request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "query": str(request.url.query),
            "request_id": request_id,
        }
    )

    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error(f"[{request_id}] Request failed: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "request_id": request_id}
        )

    # Log response
    process_time = time.time() - start_time
    logger.info(
        f"[{request_id}] {request.method} {request.url.path} - {response.status_code}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "process_time": process_time,
            "request_id": request_id,
        }
    )

    response.headers["X-Request-Id"] = request_id
    response.headers["X-Process-Time"] = str(process_time)

    return response

# Health Check Endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.ENVIRONMENT,
    }

# Ready Check Endpoint (with dependencies)
@app.get("/ready", tags=["Health"])
async def ready_check():
    """Readiness check - verifies all dependencies are available"""
    try:
        # Check database
        async with SessionLocal() as session:
            await session.execute("SELECT 1")

        # Additional checks can be added here
        # - Redis connectivity
        # - RabbitMQ connectivity
        # - External service availability

        return {
            "status": "ready",
            "service": settings.SERVICE_NAME,
            "dependencies": {
                "database": "ok",
                "cache": "ok",
                "queue": "ok",
            }
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "service": settings.SERVICE_NAME,
                "error": str(e),
            }
        )

# Version Endpoint
@app.get("/version", tags=["Info"])
async def get_version():
    """Get service version"""
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "environment": settings.ENVIRONMENT,
    }

# Example route group (replace with actual service routes)
@app.get("/api/v1/example", tags=["Example"])
async def example_endpoint():
    """Example endpoint - replace with actual API routes"""
    return {
        "message": "Hello from " + settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
    }

# Import and include routers from api modules
# from app.api import auth, users, policies, etc.
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
# app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "service": settings.SERVICE_NAME,
        }
    )

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        workers=1 if settings.DEBUG else 4,
    )
