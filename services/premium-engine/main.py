"""
Premium Engine Service - Main Application

Reads products, coverage_options, and premium_rules from PostgreSQL.
Provides real-time premium calculation and admin CRUD for configuration.
"""

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import (
    Column, String, DateTime, Numeric, Integer, Boolean, Text, ForeignKey,
    select, func, delete, update, text as sa_text,
)
from sqlalchemy.ext.declarative import declarative_base
from contextlib import asynccontextmanager
import logging
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
import os

# ━━ Logging ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

# ━━ ORM Models ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class Product(Base):
    __tablename__ = "products"
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True)
    description = Column(Text)
    product_type = Column(String(50), nullable=False)   # annual / spot_1day / spot_2day
    currency = Column(String(10), default="VND")
    vat_rate = Column(Numeric(5, 4), default=Decimal("0.1000"))
    insurance_period_days = Column(Integer, default=365)
    status = Column(String(20), default="active")
    version = Column(Integer, default=1)
    effective_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class CoverageOption(Base):
    __tablename__ = "coverage_options"
    id = Column(String(36), primary_key=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    name = Column(String(255), nullable=False)
    code = Column(String(50))
    description = Column(Text)
    base_premium = Column(Numeric(15, 2), default=0)
    coverage_limit = Column(Numeric(15, 2))              # Sum Insured
    sub_limit = Column(Numeric(15, 2))
    sub_limit_label = Column(String(100))
    deductible = Column(Numeric(15, 2), default=0)
    territorial_limit = Column(String(255))
    sort_order = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class PremiumPlan(Base):
    __tablename__ = "premium_plans"
    id = Column(String(36), primary_key=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(20))
    net_premium = Column(Numeric(15, 2), nullable=False)
    total_premium = Column(Numeric(15, 2), nullable=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class PlanCoverage(Base):
    __tablename__ = "plan_coverages"
    id = Column(String(36), primary_key=True)
    plan_id = Column(String(36), ForeignKey("premium_plans.id"), nullable=False)
    coverage_option_id = Column(String(36), ForeignKey("coverage_options.id"), nullable=False)
    coverage_limit = Column(Numeric(15, 2), nullable=False)
    sub_limit = Column(Numeric(15, 2))
    created_at = Column(DateTime, default=datetime.utcnow)

class PremiumRule(Base):
    __tablename__ = "premium_rules"
    id = Column(String(36), primary_key=True)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    rule_type = Column(String(50), nullable=False)       # age, handicap, frequency
    min_value = Column(Numeric(10, 2))
    max_value = Column(Numeric(10, 2))
    adjustment_type = Column(String(20), nullable=False)  # percentage / fixed
    adjustment_value = Column(Numeric(10, 4), nullable=False)
    operator = Column(String(10), default="between")
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

# ━━ Database ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://golfins_user:golfins_pass@postgres:5432/golfins")
engine = create_async_engine(DATABASE_URL, echo=False, poolclass=NullPool)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with SessionLocal() as session:
        yield session

# ━━ Seed Data ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async def seed_premium_data(db: AsyncSession):
    """Seed data logic."""
    try:
        # Check if already seeded
        res = await db.execute(select(func.count(Product.id)))
        if res.scalar() > 0:
            logger.info("Database already seeded.")
            return

        logger.info("Initializing complete seed data...")
        now = datetime.utcnow()

        # 1. Products
        p_annual = Product(id=str(uuid.uuid4()), name='Annual Program', code='ANNUAL', product_type='annual', status='active', effective_date=now)
        p_spot1 = Product(id=str(uuid.uuid4()), name='Spot 1-Day', code='SPOT_1DAY', product_type='spot_1day', status='active', effective_date=now)
        p_spot2 = Product(id=str(uuid.uuid4()), name='Spot 2-Day', code='SPOT_2DAY', product_type='spot_2day', status='active', effective_date=now)
        db.add_all([p_annual, p_spot1, p_spot2])
        await db.flush()

        # 2. Plans
        plans = [
            PremiumPlan(id=str(uuid.uuid4()), product_id=p_annual.id, name='Plan A', code='A', net_premium=Decimal("1300000"), total_premium=Decimal("1430000"), sort_order=1),
            PremiumPlan(id=str(uuid.uuid4()), product_id=p_annual.id, name='Plan B', code='B', net_premium=Decimal("1900000"), total_premium=Decimal("2090000"), sort_order=2),
            PremiumPlan(id=str(uuid.uuid4()), product_id=p_annual.id, name='Plan C', code='C', net_premium=Decimal("2800000"), total_premium=Decimal("3080000"), sort_order=3),
            PremiumPlan(id=str(uuid.uuid4()), product_id=p_spot1.id, name='Plan 1', code='1DAY', net_premium=Decimal("90909"), total_premium=Decimal("100000"), sort_order=1),
            PremiumPlan(id=str(uuid.uuid4()), product_id=p_spot2.id, name='Plan 2', code='2DAY', net_premium=Decimal("177273"), total_premium=Decimal("195000"), sort_order=1),
        ]
        db.add_all(plans)
        
        # 3. Coverage Options
        c_liability = CoverageOption(id=str(uuid.uuid4()), product_id=p_annual.id, name='Liability to public', code='LIABILITY', sort_order=1, territorial_limit='Vietnam')
        c_personal = CoverageOption(id=str(uuid.uuid4()), product_id=p_annual.id, name='Personal Accident', code='ACCIDENT', sort_order=2, territorial_limit='Vietnam')
        db.add_all([c_liability, c_personal])
        
        # 4. Rules
        r_age = PremiumRule(id=str(uuid.uuid4()), product_id=p_annual.id, name='Junior Discount', rule_type='age', min_value=0, max_value=18, adjustment_type='percentage', adjustment_value=Decimal("-20.0"), priority=1)
        db.add(r_age)

        await db.commit()
        logger.info("✅ Database Seed Completed Successfully")
    except Exception as e:
        logger.error(f"❌ Seed failed: {e}")
        await db.rollback()
        raise

# ━━ FastAPI App ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Premium Engine Service - Initializing DB")
    async with engine.begin() as conn:
        # Tables will be created automatically if missing
        await conn.run_sync(Base.metadata.create_all)
    # Seed data
    async with SessionLocal() as db:
        await seed_premium_data(db)
    yield
    logger.info("Stopping Premium Engine Service")

app = FastAPI(title="Premium Engine Service", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _dec(v) -> float:
    return float(v) if v is not None else 0.0

def _product_dict(p: Product) -> dict:
    return {
        "id": p.id, "name": p.name, "code": p.code,
        "description": p.description, "product_type": p.product_type,
        "currency": p.currency, "vat_rate": _dec(p.vat_rate),
        "insurance_period_days": p.insurance_period_days, "status": p.status,
        "version": p.version,
        "effective_date": p.effective_date.isoformat() if hasattr(p.effective_date, 'isoformat') else str(p.effective_date) if p.effective_date else None,
        "created_at": p.created_at.isoformat() if hasattr(p.created_at, 'isoformat') else None,
    }

def _plan_dict(p: PremiumPlan) -> dict:
    return {
        "id": p.id, "product_id": p.product_id,
        "name": p.name, "code": p.code,
        "net_premium": _dec(p.net_premium), "total_premium": _dec(p.total_premium),
        "sort_order": p.sort_order, "is_active": p.is_active,
    }

# ━━ PUBLIC API ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/health")
async def health():
    return {"status": "ok", "service": "premium-engine"}

@app.get("/api/v1/products")
async def list_products(db: AsyncSession = Depends(get_db)):
    """List all active products."""
    try:
        result = await db.execute(select(Product).where(Product.status == "active"))
        products = result.scalars().all()
        output = []
        for p in products:
            plans_res = await db.execute(select(PremiumPlan).where(PremiumPlan.product_id == p.id, PremiumPlan.is_active == True).order_by(PremiumPlan.sort_order))
            plans = plans_res.scalars().all()
            pd = _product_dict(p)
            pd["plans"] = [_plan_dict(pl) for pl in plans]
            output.append(pd)
        return {"products": output}
    except Exception as e:
        logger.error(f"API Error in list_products: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/v1/products/{product_id}")
async def get_product_detail(product_id: str, db: AsyncSession = Depends(get_db)):
    """Product detail with plans + their coverage limits."""
    try:
        # Product
        p_res = await db.execute(select(Product).where(Product.id == product_id))
        product = p_res.scalar_one_or_none()
        if not product: raise HTTPException(status_code=404, detail="Product not found")
        
        # Plans
        pl_res = await db.execute(select(PremiumPlan).where(PremiumPlan.product_id == product_id).order_by(PremiumPlan.sort_order))
        plans = pl_res.scalars().all()
        
        # Coverage Options
        c_res = await db.execute(select(CoverageOption).where(CoverageOption.product_id == product_id).order_by(CoverageOption.sort_order))
        coverages = c_res.scalars().all()

        # Plan-Coverage links
        plan_ids = [pl.id for pl in plans]
        pc_res = await db.execute(select(PlanCoverage).where(PlanCoverage.plan_id.in_(plan_ids)))
        plan_covs = pc_res.scalars().all()
        
        pc_by_plan = {}
        for pc in plan_covs:
            pc_by_plan.setdefault(pc.plan_id, []).append({
                "coverage_option_id": pc.coverage_option_id,
                "coverage_limit": _dec(pc.coverage_limit),
                "sub_limit": _dec(pc.sub_limit) if pc.sub_limit else None
            })

        plans_out = []
        for pl in plans:
            pd = _plan_dict(pl)
            pd["coverages"] = pc_by_plan.get(pl.id, [])
            plans_out.append(pd)
        
        return {
            "product": _product_dict(product),
            "plans": plans_out,
            "coverages": [
                {"id": c.id, "name": c.name, "code": c.code, "territorial_limit": c.territorial_limit, "sub_limit_label": c.sub_limit_label} 
                for c in coverages
            ]
        }
    except HTTPException: raise
    except Exception as e:
        logger.error(f"API Error in get_product_detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ━━ ADMIN API (Full CRUD) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ── Products ──────────

@app.post("/api/v1/admin/products")
async def admin_create_product(data: dict, db: AsyncSession = Depends(get_db)):
    product = Product(
        id=str(uuid.uuid4()),
        name=data["name"], code=data.get("code"),
        description=data.get("description"),
        product_type=data.get("product_type", "annual"),
        currency=data.get("currency", "VND"),
        vat_rate=Decimal(str(data.get("vat_rate", "0.1000"))),
        insurance_period_days=data.get("insurance_period_days", 365),
        status="active", version=1,
        effective_date=datetime.utcnow()
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return _product_dict(product)

@app.put("/api/v1/admin/products/{product_id}")
async def admin_update_product(product_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    try:
        res = await db.execute(select(Product).where(Product.id == product_id))
        product = res.scalar_one_or_none()
        if not product: raise HTTPException(status_code=404, detail="Product not found")
        
        # Protected fields that shouldn't be updated via this generic loop
        protected = {'id', 'created_at', 'updated_at', 'code'}
        
        for k, v in data.items():
            if k in protected: continue
            if hasattr(product, k):
                try:
                    if k == 'vat_rate': 
                        v = Decimal(str(v))
                    elif k == 'insurance_period_days':
                        v = int(v)
                    setattr(product, k, v)
                except (ValueError, ArithmeticError) as e:
                    logger.warning(f"Failed to set field {k} with value {v}: {e}")
                    continue
                    
        product.updated_at = datetime.utcnow()
        await db.commit()
        return _product_dict(product)
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/admin/products/{product_id}")
async def admin_delete_product(product_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Product).where(Product.id == product_id))
    await db.commit()
    return {"message": "Product deleted"}

# ── Plans ─────────────

@app.get("/api/v1/admin/products/{product_id}/plans")
async def admin_list_plans(product_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PremiumPlan).where(PremiumPlan.product_id == product_id).order_by(PremiumPlan.sort_order))
    plans = res.scalars().all()
    return {"plans": [_plan_dict(p) for p in plans]}

@app.post("/api/v1/admin/products/{product_id}/plans")
async def admin_create_plan(product_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    plan = PremiumPlan(
        id=str(uuid.uuid4()), product_id=product_id,
        name=data["name"], code=data.get("code"),
        net_premium=Decimal(str(data["net_premium"])),
        total_premium=Decimal(str(data["total_premium"])),
        sort_order=data.get("sort_order", 0),
        is_active=True
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return _plan_dict(plan)

@app.put("/api/v1/admin/plans/{plan_id}")
async def admin_update_plan(plan_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PremiumPlan).where(PremiumPlan.id == plan_id))
    plan = res.scalar_one_or_none()
    if not plan: raise HTTPException(status_code=404)
    if 'net_premium' in data: plan.net_premium = Decimal(str(data['net_premium']))
    if 'total_premium' in data: plan.total_premium = Decimal(str(data['total_premium']))
    if 'name' in data: plan.name = data['name']
    if 'code' in data: plan.code = data['code']
    if 'sort_order' in data: plan.sort_order = data['sort_order']
    if 'is_active' in data: plan.is_active = data['is_active']
    plan.updated_at = datetime.utcnow()
    await db.commit()
    return _plan_dict(plan)

# ── Coverages ─────────

@app.get("/api/v1/admin/products/{product_id}/coverages")
async def admin_list_coverages(product_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CoverageOption).where(CoverageOption.product_id == product_id).order_by(CoverageOption.sort_order))
    coverages = res.scalars().all()
    return {"coverages": [
        {"id": c.id, "name": c.name, "code": c.code, "territorial_limit": c.territorial_limit, "sub_limit_label": c.sub_limit_label, "sort_order": c.sort_order} 
        for c in coverages
    ]}

@app.post("/api/v1/admin/products/{product_id}/coverages")
async def admin_create_coverage(product_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    cov = CoverageOption(
        id=str(uuid.uuid4()), product_id=product_id,
        name=data["name"], code=data.get("code"),
        territorial_limit=data.get("territorial_limit"),
        sub_limit_label=data.get("sub_limit_label"),
        sort_order=data.get("sort_order", 0)
    )
    db.add(cov)
    await db.commit()
    await db.refresh(cov)
    return {"id": cov.id, "name": cov.name}

# ── Rules ─────────────

@app.get("/api/v1/admin/products/{product_id}/rules")
async def admin_list_rules(product_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(PremiumRule).where(PremiumRule.product_id == product_id).order_by(PremiumRule.priority))
    rules = res.scalars().all()
    return {"rules": [
        {
            "id": r.id, "name": r.name, "rule_type": r.rule_type,
            "min_value": _dec(r.min_value), "max_value": _dec(r.max_value),
            "adjustment_type": r.adjustment_type, "adjustment_value": _dec(r.adjustment_value),
            "priority": r.priority, "is_active": r.is_active
        } for r in rules
    ]}

@app.post("/api/v1/admin/products/{product_id}/rules")
async def admin_create_rule(product_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    rule = PremiumRule(
        id=str(uuid.uuid4()), product_id=product_id,
        name=data["name"], rule_type=data["rule_type"],
        min_value=Decimal(str(data.get("min_value", 0))),
        max_value=Decimal(str(data.get("max_value", 0))),
        adjustment_type=data["adjustment_type"],
        adjustment_value=Decimal(str(data["adjustment_value"])),
        priority=data.get("priority", 0)
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return {"id": rule.id, "name": rule.name}

# ── Bulk Plan Coverages ──

@app.put("/api/v1/admin/plan-coverages/{plan_id}")
async def admin_set_plan_coverages(plan_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Bulk update coverage limits for a plan."""
    # Delete existing configs for this plan
    await db.execute(delete(PlanCoverage).where(PlanCoverage.plan_id == plan_id))
    # Add new configs
    for item in data.get("coverages", []):
        db.add(PlanCoverage(
            id=str(uuid.uuid4()), plan_id=plan_id,
            coverage_option_id=item["coverage_option_id"],
            coverage_limit=Decimal(str(item["coverage_limit"])),
            sub_limit=Decimal(str(item["sub_limit"])) if item.get("sub_limit") else None
        ))
    await db.commit()
    return {"message": "Plan coverages updated"}

# ── Stats ─────────────

@app.get("/api/v1/admin/premium/stats")
async def admin_stats(db: AsyncSession = Depends(get_db)):
    try:
        p = await db.scalar(select(func.count(Product.id)))
        pl = await db.scalar(select(func.count(PremiumPlan.id)))
        c = await db.scalar(select(func.count(CoverageOption.id)))
        r = await db.scalar(select(func.count(PremiumRule.id)))
        return {"total_products": p or 0, "total_plans": pl or 0, "total_coverages": c or 0, "total_rules": r or 0}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
