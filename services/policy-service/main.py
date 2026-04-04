"""Policy Service - Main Application"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import Column, String, DateTime, Numeric, JSON, Integer, Text, update
from sqlalchemy.ext.declarative import declarative_base
from contextlib import asynccontextmanager
import logging
import uuid
import enum
import httpx
import os
import asyncio
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

class PolicyStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_PAYMENT = "pending_payment"
    AWAITING_CONFIRMATION = "awaiting_confirmation"
    ACTIVE = "active"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

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
    status = Column(String(50), default="draft")
    premium_amount = Column(Numeric(10, 2))
    expiry_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False)
    policy_id = Column(String(36), nullable=True)
    name = Column(String(255), nullable=False)
    category = Column(String(50), default="other")
    brand = Column(String(100))
    model_name = Column(String(100))
    serial_number = Column(String(100))
    purchase_date = Column(String(20))
    estimated_value = Column(Numeric(10, 2), default=0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/golfins")
engine = create_async_engine(DATABASE_URL, echo=False, poolclass=NullPool)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with SessionLocal() as session:
        yield session

# ── Background Task & Business Logic ───────────────────────────────────────────

async def check_expiry_task():
    """Background task to check and expire policies every hour"""
    while True:
        await asyncio.sleep(3600) # Check every hour
        logger.info("⏰ Running automated expiry check...")
        try:
            async with SessionLocal() as db:
                now = datetime.utcnow()
                query = update(Policy).where(
                    Policy.status == "active",
                    Policy.expiry_date < now
                ).values(status="expired", updated_at=now)
                
                result = await db.execute(query)
                await db.commit()
                if result.rowcount > 0:
                    logger.info(f"✅ Automatically expired {result.rowcount} policies.")
        except Exception as e:
            logger.error(f"❌ Expiry check failed: {e}")

async def send_activation_email(policy: Policy, user_email: str, user_name: str):
    """Notify user that their policy is now active"""
    if not user_email: return
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                "http://notification-service:8000/api/v1/notifications/send",
                json={
                    "recipient_email": user_email,
                    "template": "policy_active",
                    "data": {
                        "name": user_name or "Valued Customer",
                        "policy_number": policy.policy_number,
                        "expiry_date": policy.expiry_date.strftime("%Y-%m-%d") if policy.expiry_date else "N/A",
                        "certificate_link": f"http://localhost/api/documents/certificate/{policy.id}"
                    },
                },
            )
            logger.info(f"📧 Activation email sent to {user_email}")
    except Exception as e:
        logger.warning(f"Notification failed: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Policy Service")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Start background task
    asyncio.create_task(check_expiry_task())
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

@app.get("/api/v1/products")
async def get_products(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    result = await db.execute(select(Product).where(Product.status == "active"))
    products = result.scalars().all()
    return {"products": [{"id": p.id, "name": p.name, "type": p.product_type} for p in products]}

@app.post("/api/v1/policies")
async def create_policy(data: dict, db: AsyncSession = Depends(get_db)):
    policy = Policy(
        id=str(uuid.uuid4()),
        policy_number=f"POL-{uuid.uuid4().hex[:6].upper()}",
        user_id=data.get("user_id"),
        product_id=data.get("product_id"),
        premium_amount=data.get("premium", 0),
        status="pending_payment"
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
            logger.warning(f"Notification failed: {e}")

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
            "expiry_date": p.expiry_date.isoformat() if p.expiry_date else None,
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
        "expiry_date": policy.expiry_date.isoformat() if policy.expiry_date else None,
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
    if new_status not in ("active", "draft", "cancelled", "expired", "pending_payment", "awaiting_confirmation"):
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")
    
    # Activation logic
    if new_status == "active" and policy.status != "active":
        policy.expiry_date = datetime.utcnow() + timedelta(days=365)
        # Assuming metadata might contain user info, or we can use generic placeholders
        asyncio.create_task(send_activation_email(policy, data.get("email"), data.get("name")))

    policy.status = new_status
    policy.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(policy)
    return {"id": policy.id, "policy_number": policy.policy_number, "status": policy.status}

@app.post("/api/v1/payments/webhook")
async def payment_webhook(data: dict, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    content = data.get("transaction_content", "").upper()
    if "GOLF " not in content:
        return {"status": "ignored"}
    
    parts = content.split("GOLF ")
    policy_num = parts[1].strip().split(" ")[0]
    result = await db.execute(select(Policy).where(Policy.policy_number == policy_num))
    policy = result.scalar_one_or_none()
    
    if not policy:
        return {"status": "error", "reason": "Not found"}

    if policy.status != "active":
        policy.status = "active"
        policy.expiry_date = datetime.utcnow() + timedelta(days=365)
        policy.updated_at = datetime.utcnow()
        await db.commit()
        # Trigger activation notification
        asyncio.create_task(send_activation_email(policy, data.get("email"), data.get("name")))
    
    return {"status": "success", "policy_number": policy_num}

@app.get("/api/v1/admin/policies/stats")
async def admin_policies_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select, func
    pol_result = await db.execute(select(Policy.status, func.count(Policy.id)).group_by(Policy.status))
    pol_rows = pol_result.all()
    pol_stats = {row[0]: row[1] for row in pol_rows}
    prod_result = await db.execute(select(func.count(Product.id)).where(Product.status == "active"))
    return {
        "total_policies": sum(pol_stats.values()),
        "active_policies": pol_stats.get("active", 0),
        "total_products": prod_result.scalar() or 0,
    }

@app.post("/api/v1/equipment")
async def register_equipment(data: dict, db: AsyncSession = Depends(get_db)):
    equip = Equipment(
        id=str(uuid.uuid4()),
        user_id=data["user_id"],
        policy_id=data.get("policy_id"),
        name=data["name"],
        category=data.get("category", "other"),
        status="active",
    )
    db.add(equip)
    await db.commit()
    await db.refresh(equip)
    return _equip_dict(equip)

@app.get("/api/v1/equipment")
async def list_equipment(user_id: str = None, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    query = select(Equipment).order_by(Equipment.created_at.desc())
    if user_id:
        query = query.where(Equipment.user_id == user_id)
    result = await db.execute(query)
    items = result.scalars().all()
    return {"equipment": [_equip_dict(e) for e in items]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
