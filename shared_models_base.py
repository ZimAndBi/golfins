"""
Shared Database Models - Common to all services
Location: shared/models/base.py
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Enum, JSON, DECIMAL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import declared_attr
import uuid
import enum

Base = declarative_base()

class BaseModel(Base):
    """Abstract base model with common fields"""
    __abstract__ = True

    @declared_attr
    def id(cls):
        return Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    @declared_attr
    def created_at(cls):
        return Column(DateTime, default=datetime.utcnow, nullable=False)

    @declared_attr
    def updated_at(cls):
        return Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

# Enums
class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"
    ADJUSTER = "adjuster"
    UNDERWRITER = "underwriter"
    PARTNER = "partner"

class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class PolicyStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    RENEWAL_PENDING = "renewal_pending"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class ClaimStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    REVIEWING = "reviewing"
    DOCUMENT_REQUESTED = "document_requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"

class ClaimType(str, enum.Enum):
    ROUND_PLAY = "round_play"
    EQUIPMENT = "equipment"
    HOLE_IN_ONE = "hole_in_one"

class ProductType(str, enum.Enum):
    ROUND = "round"
    ANNUAL = "annual"
    HOLE_IN_ONE = "hole_in_one"
    EQUIPMENT = "equipment"

# User Model
class User(BaseModel):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20))
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    date_of_birth = Column(DateTime)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    email_verified = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)

    __mapper_args__ = {
        "polymorphic_on": role,
        "polymorphic_identity": UserRole.CUSTOMER
    }

# Golf Course Model
class GolfCourse(BaseModel):
    __tablename__ = "golf_courses"

    name = Column(String(255), nullable=False)
    location_city = Column(String(100))
    state_province = Column(String(100))
    country = Column(String(100))
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    phone = Column(String(20))
    email = Column(String(255))
    handicap_index = Column(DECIMAL(5, 1))
    num_holes = Column(Integer)
    par_score = Column(Integer)
    website = Column(String(255))
    status = Column(String(20), default="active")

# Product Model
class Product(BaseModel):
    __tablename__ = "products"

    name = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="active")
    product_type = Column(Enum(ProductType), nullable=False)
    version = Column(Integer, default=1)
    effective_date = Column(DateTime)
    end_date = Column(DateTime, nullable=True)
    created_by = Column(String(36))

# Coverage Option Model
class CoverageOption(BaseModel):
    __tablename__ = "coverage_options"

    product_id = Column(String(36), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    base_premium = Column(DECIMAL(10, 2), nullable=False)
    coverage_limit = Column(DECIMAL(10, 2))
    deductible = Column(DECIMAL(10, 2))
    active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)

# Premium Rule Model
class PremiumRule(BaseModel):
    __tablename__ = "premium_rules"

    product_id = Column(String(36), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    rule_type = Column(String(50), nullable=False)  # age, handicap, frequency, course, coverage
    min_value = Column(DECIMAL(10, 2))
    max_value = Column(DECIMAL(10, 2))
    adjustment_type = Column(String(20), nullable=False)  # percent, fixed
    adjustment_value = Column(DECIMAL(10, 4), nullable=False)
    operator = Column(String(10), nullable=False)  # >, >=, <, <=, ==, in
    priority = Column(Integer, default=0)
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_by = Column(String(36))
    effective_date = Column(DateTime)
    end_date = Column(DateTime, nullable=True)

# Policy Model
class Policy(BaseModel):
    __tablename__ = "policies"

    policy_number = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    product_id = Column(String(36), nullable=False, index=True)
    status = Column(Enum(PolicyStatus), default=PolicyStatus.DRAFT, nullable=False)
    premium_amount = Column(DECIMAL(10, 2), nullable=False)
    calculated_by = Column(JSON)  # rules applied
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    renewal_date = Column(DateTime)
    golf_course_id = Column(String(36), nullable=True)
    partner_id = Column(String(36), nullable=True)
    certificate_generated = Column(Boolean, default=False)
    certificate_path = Column(String(500))
    qr_code_token = Column(String(500))
    payment_status = Column(String(20))  # pending, completed, failed
    payment_date = Column(DateTime, nullable=True)
    transaction_id = Column(String(100))
    deleted_at = Column(DateTime, nullable=True)

# Claim Model
class Claim(BaseModel):
    __tablename__ = "claims"

    claim_number = Column(String(50), unique=True, nullable=False, index=True)
    policy_id = Column(String(36), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    claim_type = Column(Enum(ClaimType), nullable=False)
    status = Column(Enum(ClaimStatus), default=ClaimStatus.SUBMITTED, nullable=False)
    claim_amount_requested = Column(DECIMAL(10, 2), nullable=False)
    claim_amount_approved = Column(DECIMAL(10, 2), nullable=True)
    incident_date = Column(DateTime, nullable=False)
    incident_description = Column(Text)
    golf_course_id = Column(String(36), nullable=True)
    incident_latitude = Column(DECIMAL(10, 8))
    incident_longitude = Column(DECIMAL(11, 8))
    case_notes = Column(Text)
    assigned_adjuster_id = Column(String(36))
    approved_by = Column(String(36))
    rejection_reason = Column(Text)
    payment_date = Column(DateTime, nullable=True)
    payment_amount = Column(DECIMAL(10, 2))
    payment_method = Column(String(50))
