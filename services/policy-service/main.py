"""Policy Service - Main Application"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import Column, String, DateTime, Numeric, JSON, Integer, Enum, Text
from sqlalchemy.ext.declarative import declarative_base
from contextlib import asynccontextmanager
import logging
import uuid
import enum
import httpx
from datetime import datetime, timedelta
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

class PolicyStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    CANCELLED = "cancelled"

class Product(Base):
    __tablename__ = "products"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255))
    description = Column(Text)
    status = Column(String(20), default="active")
    product_type = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Policy(Base):
    __tablename__ = "policies"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_number = Column(String(50), unique=True)
    user_id = Column(String(36))
    product_id = Column(String(36))
    status = Column(String(20), default="draft")
    premium_amount = Column(Numeric(10, 2))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False)
    policy_id = Column(String(36), nullable=True)
    name = Column(String(255), nullable=False)
    category = Column(String(50), default="other")   # driver/iron/putter/bag/cart/rangefinder/other
    brand = Column(String(100))
    model_name = Column(String(100))
    serial_number = Column(String(100))
    purchase_date = Column(String(20))
    estimated_value = Column(Numeric(10, 2), default=0)
    status = Column(String(20), default="active")    # active / lost / damaged / claimed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/golfins")
engine = create_async_engine(DATABASE_URL, echo=False, poolclass=NullPool)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with SessionLocal() as session:
        yield session

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Policy Service")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    logger.info("Shutting down Policy Service")

app = FastAPI(title="Policy Service", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def _equip_dict(e: Equipment) -> dict:
    return {
        "id": e.id,
        "user_id": e.user_id,
        "policy_id": e.policy_id,
        "name": e.name,
        "category": e.category,
        "brand": e.brand,
        "model_name": e.model_name,
        "serial_number": e.serial_number,
        "purchase_date": e.purchase_date,
        "estimated_value": float(e.estimated_value) if e.estimated_value else 0,
        "status": e.status,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "policy-service"}

# ── Products ───────────────────────────────────────────────────────────────────

@app.get("/api/v1/products")
async def get_products(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(Product).where(Product.status == "active"))
    products = result.scalars().all()
    return {"products": [{"id": p.id, "name": p.name, "type": p.product_type} for p in products]}

# ── Policies ──────────────────────────────────────────────────────────────────

@app.post("/api/v1/policies")
async def create_policy(data: dict, db: AsyncSession = Depends(get_db)):
    policy = Policy(
        id=str(uuid.uuid4()),
        policy_number=f"POL-{uuid.uuid4().hex[:6].upper()}",
        user_id=data.get("user_id"),
        product_id=data.get("product_id"),
        premium_amount=data.get("premium", 0),
        status="active"
    )
    db.add(policy)
    await db.commit()
    await db.refresh(policy)

    recipient_email = data.get("email")
    if recipient_email:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                await client.post(
                    "http://notification-service:8000/api/v1/notifications/send",
                    json={
                        "recipient_email": recipient_email,
                        "template": "policy_purchased",
                        "data": {
                            "name": data.get("name", "Valued Customer"),
                            "policy_number": policy.policy_number,
                            "premium": str(policy.premium_amount),
                        },
                    },
                )
        except Exception as e:
            logger.warning(f"Notification failed (non-critical): {e}")

    return {"id": policy.id, "policy_id": policy.id, "policy_number": policy.policy_number, "status": policy.status}

@app.get("/api/v1/policies")
async def get_policies(user_id: str = None, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    query = select(Policy).order_by(Policy.created_at.desc())
    if user_id:
        query = query.where(Policy.user_id == user_id)
    result = await db.execute(query)
    policies = result.scalars().all()
    return {"policies": [
        {
            "id": p.id,
            "policy_number": p.policy_number,
            "status": p.status,
            "premium_amount": float(p.premium_amount) if p.premium_amount else 0,
            "product_id": p.product_id,
            "user_id": p.user_id,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in policies
    ]}

@app.get("/api/v1/policies/{policy_id}")
async def get_policy(policy_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {
        "id": policy.id,
        "policy_number": policy.policy_number,
        "status": policy.status,
        "premium_amount": float(policy.premium_amount) if policy.premium_amount else 0,
        "product_id": policy.product_id,
        "user_id": policy.user_id,
        "created_at": policy.created_at.isoformat() if policy.created_at else None,
        "updated_at": policy.updated_at.isoformat() if policy.updated_at else None,
    }

@app.patch("/api/v1/policies/{policy_id}/status")
async def update_policy_status(policy_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(Policy).where(Policy.id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    new_status = data.get("status")
    if new_status not in ("active", "draft", "cancelled", "expired"):
        raise HTTPException(status_code=400, detail="Invalid status")
    policy.status = new_status
    policy.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(policy)
    return {"id": policy.id, "policy_number": policy.policy_number, "status": policy.status}

@app.get("/api/v1/admin/policies/stats")
async def admin_policies_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select, func
    pol_result = await db.execute(
        select(Policy.status, func.count(Policy.id)).group_by(Policy.status)
    )
    pol_rows = pol_result.all()
    pol_stats = {row[0]: row[1] for row in pol_rows}
    prod_result = await db.execute(select(func.count(Product.id)).where(Product.status == "active"))
    product_count = prod_result.scalar() or 0
    equip_result = await db.execute(select(func.count(Equipment.id)))
    equip_count = equip_result.scalar() or 0
    total_pol = sum(pol_stats.values())
    return {
        "total_policies": total_pol,
        "active_policies": pol_stats.get("active", 0),
        "draft_policies": pol_stats.get("draft", 0),
        "cancelled_policies": pol_stats.get("cancelled", 0),
        "total_products": product_count,
        "total_equipment": equip_count,
    }

# ── Equipment Registry ────────────────────────────────────────────────────────

VALID_CATEGORIES = {"driver", "iron", "putter", "wedge", "bag", "cart", "rangefinder", "other"}

@app.post("/api/v1/equipment")
async def register_equipment(data: dict, db: AsyncSession = Depends(get_db)):
    """Register a piece of golf equipment"""
    if not data.get("name"):
        raise HTTPException(status_code=400, detail="name is required")
    if not data.get("user_id"):
        raise HTTPException(status_code=400, detail="user_id is required")

    equip = Equipment(
        id=str(uuid.uuid4()),
        user_id=data["user_id"],
        policy_id=data.get("policy_id"),
        name=data["name"],
        category=data.get("category", "other") if data.get("category") in VALID_CATEGORIES else "other",
        brand=data.get("brand", ""),
        model_name=data.get("model_name", ""),
        serial_number=data.get("serial_number", ""),
        purchase_date=data.get("purchase_date", ""),
        estimated_value=float(data.get("estimated_value", 0)),
        status="active",
    )
    db.add(equip)
    await db.commit()
    await db.refresh(equip)
    return _equip_dict(equip)

@app.get("/api/v1/equipment")
async def list_equipment(user_id: str = None, db: AsyncSession = Depends(get_db)):
    """List equipment, optionally filtered by user"""
    from sqlalchemy import select
    query = select(Equipment).order_by(Equipment.created_at.desc())
    if user_id:
        query = query.where(Equipment.user_id == user_id)
    result = await db.execute(query)
    items = result.scalars().all()
    total_value = sum(float(e.estimated_value or 0) for e in items)
    return {"equipment": [_equip_dict(e) for e in items], "total_value": total_value}

@app.get("/api/v1/equipment/{equipment_id}")
async def get_equipment(equipment_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
    equip = result.scalar_one_or_none()
    if not equip:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return _equip_dict(equip)

@app.patch("/api/v1/equipment/{equipment_id}")
async def update_equipment_status(equipment_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Update equipment status (active/lost/damaged/claimed)"""
    from sqlalchemy import select
    result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
    equip = result.scalar_one_or_none()
    if not equip:
        raise HTTPException(status_code=404, detail="Equipment not found")
    new_status = data.get("status")
    if new_status and new_status in ("active", "lost", "damaged", "claimed"):
        equip.status = new_status
    equip.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(equip)
    return _equip_dict(equip)

@app.delete("/api/v1/equipment/{equipment_id}")
async def delete_equipment(equipment_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select, delete
    result = await db.execute(select(Equipment).where(Equipment.id == equipment_id))
    equip = result.scalar_one_or_none()
    if not equip:
        raise HTTPException(status_code=404, detail="Equipment not found")
    await db.execute(delete(Equipment).where(Equipment.id == equipment_id))
    await db.commit()
    return {"message": "Equipment removed"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
