"""
Policy Service - Models
Location: services/policy-service/app/models/policy.py
"""

from sqlalchemy import Column, String, DateTime, Boolean, Numeric, Text, JSON, ForeignKey, Integer, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid
import enum

Base = declarative_base()


class PolicyStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    RENEWAL_PENDING = "renewal_pending"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="active")
    product_type = Column(String(50), nullable=False)
    version = Column(Integer, default=1)
    effective_date = Column(DateTime)
    end_date = Column(DateTime)
    created_by = Column(String(36))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class CoverageOption(Base):
    __tablename__ = "coverage_options"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(String(36), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    base_premium = Column(Numeric(10, 2), nullable=False)
    coverage_limit = Column(Numeric(10, 2))
    deductible = Column(Numeric(10, 2))
    active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Policy(Base):
    __tablename__ = "policies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_number = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    product_id = Column(String(36), nullable=False, index=True)
    status = Column(SQLEnum(PolicyStatus), default=PolicyStatus.DRAFT, nullable=False)
    premium_amount = Column(Numeric(10, 2), nullable=False)
    calculated_by = Column(JSON)  # rules applied
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    renewal_date = Column(DateTime)
    golf_course_id = Column(String(36))
    partner_id = Column(String(36))
    certificate_generated = Column(Boolean, default=False)
    certificate_path = Column(String(500))
    qr_code_token = Column(String(500))
    payment_status = Column(String(20))
    payment_date = Column(DateTime)
    transaction_id = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime)


class PolicyCoverage(Base):
    __tablename__ = "policy_coverages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_id = Column(String(36), nullable=False, index=True)
    coverage_option_id = Column(String(36), nullable=False)
    premium_amount = Column(Numeric(10, 2))
    coverage_limit = Column(Numeric(10, 2))
    deductible = Column(Numeric(10, 2))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
