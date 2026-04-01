"""Claims Service - Main Application"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
import httpx
from sqlalchemy import Column, String, DateTime, Numeric, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
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

Base = declarative_base()

class Claim(Base):
    __tablename__ = "claims"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    claim_number = Column(String(50), unique=True)
    policy_id = Column(String(36))
    user_id = Column(String(36))
    claim_type = Column(String(30), default="regular")   # regular | hole_in_one
    status = Column(String(20), default="submitted")
    amount_requested = Column(Numeric(10, 2))
    description = Column(Text)
    incident_date = Column(String(20))
    metadata_ = Column("metadata", JSON, nullable=True)  # HOI extra fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

async def get_db():
    async with SessionLocal() as session:
        yield session

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Claims Service")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    logger.info("Stopping Claims Service")

app = FastAPI(title="Claims Service", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def _claim_dict(c: Claim) -> dict:
    return {
        "id": c.id,
        "claim_number": c.claim_number,
        "claim_type": c.claim_type or "regular",
        "policy_id": c.policy_id,
        "user_id": c.user_id,
        "status": c.status,
        "amount_requested": float(c.amount_requested) if c.amount_requested else 0,
        "description": c.description,
        "incident_date": c.incident_date,
        "metadata": c.metadata_ or {},
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


async def _send_notification(email: str, template: str, data: dict) -> None:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(
                "http://notification-service:8000/api/v1/notifications/send",
                json={"recipient_email": email, "template": template, "data": data},
            )
    except Exception as e:
        logger.warning(f"Notification failed (non-critical): {e}")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "claims-service"}


# ── Regular claim ──────────────────────────────────────────────────────────────

@app.post("/api/v1/claims")
async def create_claim(data: dict, db: AsyncSession = Depends(get_db)):
    """Submit a regular insurance claim"""
    claim = Claim(
        id=str(uuid.uuid4()),
        claim_number=f"CLM-{uuid.uuid4().hex[:6].upper()}",
        policy_id=data.get("policy_id"),
        user_id=data.get("user_id"),
        claim_type="regular",
        status="submitted",
        amount_requested=float(data.get("amount", 0)),
        description=data.get("description", ""),
        incident_date=data.get("incident_date", ""),
    )
    db.add(claim)
    await db.commit()
    await db.refresh(claim)

    if data.get("email"):
        await _send_notification(data["email"], "claim_submitted", {
            "name": data.get("name", "Valued Customer"),
            "claim_number": claim.claim_number,
            "amount": str(claim.amount_requested),
        })

    return _claim_dict(claim)


# ── Hole-in-One claim ─────────────────────────────────────────────────────────

@app.post("/api/v1/claims/hole-in-one")
async def create_hole_in_one_claim(data: dict, db: AsyncSession = Depends(get_db)):
    """
    Submit a Hole-in-One celebration claim.
    Auto-approved when: handicap 0-54 AND at least 1 witness.
    """
    handicap = data.get("handicap_index")
    witnesses = data.get("witnesses", [])
    course_name = data.get("course_name", "")
    hole_number = data.get("hole_number")
    celebration_amount = float(data.get("celebration_amount", 0))

    # Validation
    if not course_name:
        raise HTTPException(status_code=400, detail="course_name is required")
    if hole_number is None or not (1 <= int(hole_number) <= 18):
        raise HTTPException(status_code=400, detail="hole_number must be between 1 and 18")
    if handicap is None:
        raise HTTPException(status_code=400, detail="handicap_index is required")
    if not (0 <= float(handicap) <= 54):
        raise HTTPException(status_code=400, detail="handicap_index must be between 0 and 54")

    # Auto-approve if conditions met: valid handicap + at least 1 witness
    auto_approved = len(witnesses) >= 1
    status = "approved" if auto_approved else "under_review"

    hoi_meta = {
        "course_name": course_name,
        "hole_number": int(hole_number),
        "handicap_index": float(handicap),
        "witnesses": witnesses,
        "auto_approved": auto_approved,
    }

    claim = Claim(
        id=str(uuid.uuid4()),
        claim_number=f"HOI-{uuid.uuid4().hex[:6].upper()}",
        policy_id=data.get("policy_id"),
        user_id=data.get("user_id"),
        claim_type="hole_in_one",
        status=status,
        amount_requested=celebration_amount,
        description=f"Hole-in-One on hole {hole_number} at {course_name}",
        incident_date=data.get("incident_date", ""),
        metadata_=hoi_meta,
    )
    db.add(claim)
    await db.commit()
    await db.refresh(claim)

    if data.get("email"):
        template = "hoi_approved" if auto_approved else "claim_submitted"
        await _send_notification(data["email"], template, {
            "name": data.get("name", "Valued Golfer"),
            "claim_number": claim.claim_number,
            "course_name": course_name,
            "hole_number": hole_number,
            "amount": str(celebration_amount),
            "auto_approved": auto_approved,
        })

    return {**_claim_dict(claim), "auto_approved": auto_approved}


# ── Read endpoints ─────────────────────────────────────────────────────────────

@app.get("/api/v1/claims")
async def list_claims(user_id: str = None, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    query = select(Claim).order_by(Claim.created_at.desc())
    if user_id:
        query = query.where(Claim.user_id == user_id)
    result = await db.execute(query)
    return {"claims": [_claim_dict(c) for c in result.scalars().all()]}


@app.get("/api/v1/claims/{claim_id}")
async def get_claim(claim_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return _claim_dict(claim)


@app.patch("/api/v1/claims/{claim_id}/status")
async def update_claim_status(claim_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(Claim).where(Claim.id == claim_id))
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    new_status = data.get("status")
    if new_status not in ("approved", "rejected", "under_review", "submitted"):
        raise HTTPException(status_code=400, detail="Invalid status")
    claim.status = new_status
    claim.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(claim)
    return {"id": claim.id, "claim_number": claim.claim_number, "status": claim.status}


@app.get("/api/v1/admin/claims/stats")
async def admin_claims_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select, func
    result = await db.execute(
        select(Claim.status, func.count(Claim.id)).group_by(Claim.status)
    )
    rows = result.all()
    stats = {row[0]: row[1] for row in rows}
    # HOI count
    hoi_result = await db.execute(
        select(func.count(Claim.id)).where(Claim.claim_type == "hole_in_one")
    )
    hoi_count = hoi_result.scalar() or 0
    total = sum(stats.values())
    return {
        "total": total,
        "submitted": stats.get("submitted", 0),
        "under_review": stats.get("under_review", 0),
        "approved": stats.get("approved", 0),
        "rejected": stats.get("rejected", 0),
        "hole_in_one": hoi_count,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
