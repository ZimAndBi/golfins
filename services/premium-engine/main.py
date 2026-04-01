"""Premium Engine - Main Application"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from contextlib import asynccontextmanager
import logging
import uuid
from datetime import datetime
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/golfins")
engine = create_async_engine(DATABASE_URL, echo=False, poolclass=NullPool)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with SessionLocal() as session:
        yield session

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Premium Engine Service")
    yield
    logger.info("Stopping Premium Engine Service")

app = FastAPI(title="Premium Engine Service", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "premium-engine"}

@app.post("/api/v1/quotes/calculate")
async def calculate_quote(data: dict, db: AsyncSession = Depends(get_db)):
    """Calculate insurance premium based on golfer profile"""
    age = data.get("age", 35)
    handicap = data.get("handicap", 12)
    frequency = data.get("frequency", 20)

    # Base premium
    base = 50.0
    adjustments = []

    # Age adjustment
    if age < 30:
        base *= 0.85
        adjustments.append({"type": "age", "value": -15})
    elif age > 60:
        base *= 1.2
        adjustments.append({"type": "age", "value": 20})

    # Handicap adjustment
    if handicap < 10:
        base *= 1.1
        adjustments.append({"type": "handicap", "value": 10})

    # Frequency adjustment
    if frequency >= 30:
        base += 5.0
        adjustments.append({"type": "frequency", "value": 5})

    return {
        "base_premium": round(base, 2),
        "adjustments": adjustments,
        "final_premium": round(base, 2)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
