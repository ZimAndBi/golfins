"""
Pydantic schemas for Auth Service
Location: services/auth-service/app/schemas/user.py
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"
    ADJUSTER = "adjuster"
    UNDERWRITER = "underwriter"
    PARTNER = "partner"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


# ── OTP Request / Response schemas ────────────────────────────────────────────

class OTPSendRequest(BaseModel):
    """Request to send an OTP code"""
    email: EmailStr
    purpose: str = Field(
        ...,
        pattern="^(register|reset_password)$",
        description="Purpose: 'register' or 'reset_password'"
    )
    name: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "purpose": "register",
                "name": "John"
            }
        }


class OTPVerifyRequest(BaseModel):
    """Request to verify an OTP code"""
    email: EmailStr
    purpose: str = Field(
        ...,
        pattern="^(register|reset_password)$",
        description="Purpose: 'register' or 'reset_password'"
    )
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "purpose": "register",
                "otp_code": "123456"
            }
        }


class OTPResponse(BaseModel):
    """OTP operation response"""
    status: str
    message: str
    expires_in: Optional[int] = None
    retry_after: Optional[int] = None


# ── Registration schemas ──────────────────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    """User registration request — OTP must be verified before calling this"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20, description="Mobile phone number")
    otp_code: str = Field(..., min_length=6, max_length=6, description="Verified OTP code")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "password": "SecurePass123!",
                "first_name": "John",
                "last_name": "Doe",
                "phone": "+84901234567",
                "otp_code": "123456"
            }
        }


class UserLoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "password": "SecurePass123!"
            }
        }


class TokenRefreshRequest(BaseModel):
    """Token refresh request"""
    refresh_token: str


# ── Forgot / Reset password schemas ───────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    """Request to initiate password reset — sends OTP to email"""
    email: EmailStr

    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com"
            }
        }


class ResetPasswordRequest(BaseModel):
    """Reset password using a verified OTP"""
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")
    new_password: str = Field(..., min_length=8, description="New password (min 8 chars)")

    class Config:
        json_schema_extra = {
            "example": {
                "email": "john@example.com",
                "otp_code": "123456",
                "new_password": "NewSecurePass456!"
            }
        }


class UserUpdateRequest(BaseModel):
    """Request to update user profile info"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    nationality: Optional[str] = Field(None, max_length=100)
    gender: Optional[str] = Field(None, max_length=20)
    id_passport: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=500)
    company_name: Optional[str] = Field(None, max_length=255)
    otp_code: Optional[str] = None  # Required if email or phone is changed


# ── Response schemas ──────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    """User response model"""
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    nationality: Optional[str] = None
    gender: Optional[str] = None
    id_passport: Optional[str] = None
    address: Optional[str] = None
    company_name: Optional[str] = None
    role: UserRole
    status: UserStatus
    email_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 1800
            }
        }


class AuthResponse(BaseModel):
    """Full authentication response"""
    access_token: str
    refresh_token: str
    user: UserResponse
    token_type: str = "bearer"


class UserMeResponse(BaseModel):
    """Current user info response"""
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    id_passport: Optional[str] = None
    address: Optional[str] = None
    company_name: Optional[str] = None
    role: UserRole
    status: UserStatus

    class Config:
        from_attributes = True
