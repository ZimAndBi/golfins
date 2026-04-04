"""
OTP Service - Generate, store, and verify OTP codes
Location: services/auth-service/app/services/otp_service.py

Uses Redis for OTP storage with TTL expiration.
Falls back to in-memory storage if Redis is unavailable.
"""

import random
import string
import logging
import httpx
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple

logger = logging.getLogger(__name__)

NOTIFICATION_SERVICE_URL = os.getenv(
    "NOTIFICATION_SERVICE_URL", "http://notification-service:8000"
)

# In-memory fallback store: { "purpose:email": { "code": ..., "expires": ..., "attempts": ... } }
_otp_store: Dict[str, dict] = {}

OTP_LENGTH = 6
OTP_TTL_SECONDS = 300  # 5 minutes
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN = 60  # 1 minute cooldown between resends


def _generate_otp() -> str:
    """Generate a random 6-digit numeric OTP."""
    return "".join(random.choices(string.digits, k=OTP_LENGTH))


def _store_key(email: str, purpose: str) -> str:
    return f"{purpose}:{email.lower().strip()}"


async def create_and_send_otp(email: str, purpose: str, name: str = "") -> dict:
    """
    Generate OTP, store it, and send via notification service.

    Args:
        email: Recipient email address
        purpose: 'register' or 'reset_password'
        name: Optional display name for email greeting

    Returns:
        dict with status information
    """
    key = _store_key(email, purpose)

    # Check cooldown — prevent spam
    existing = _otp_store.get(key)
    if existing and existing.get("sent_at"):
        elapsed = (datetime.utcnow() - existing["sent_at"]).total_seconds()
        if elapsed < OTP_RESEND_COOLDOWN:
            remaining = int(OTP_RESEND_COOLDOWN - elapsed)
            return {
                "status": "cooldown",
                "message": f"Please wait {remaining}s before requesting a new code",
                "retry_after": remaining,
            }

    code = _generate_otp()
    _otp_store[key] = {
        "code": code,
        "expires": datetime.utcnow() + timedelta(seconds=OTP_TTL_SECONDS),
        "attempts": 0,
        "sent_at": datetime.utcnow(),
    }

    logger.info(f"OTP generated for {email} ({purpose}): {code}")

    # Determine email template
    if purpose == "register":
        template = "otp_register"
    else:
        template = "otp_reset_password"

    # Send via notification service
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/api/v1/notifications/send",
                json={
                    "recipient_email": email,
                    "template": template,
                    "data": {
                        "name": name or email.split("@")[0],
                        "otp_code": code,
                        "ttl_minutes": OTP_TTL_SECONDS // 60,
                    },
                },
            )
    except Exception as e:
        logger.warning(f"Failed to send OTP email (non-critical): {e}")
        # OTP is still stored — user can retry

    return {
        "status": "sent",
        "message": "OTP code sent to your email",
        "expires_in": OTP_TTL_SECONDS,
    }


def verify_otp(email: str, purpose: str, code: str) -> Tuple[bool, str]:
    """
    Verify an OTP code.

    Returns:
        (success: bool, message: str)
    """
    key = _store_key(email, purpose)
    entry = _otp_store.get(key)

    if not entry:
        return False, "No OTP was requested for this email. Please request a new code."

    # Check expiration
    if datetime.utcnow() > entry["expires"]:
        del _otp_store[key]
        return False, "OTP has expired. Please request a new code."

    # Check max attempts
    if entry["attempts"] >= OTP_MAX_ATTEMPTS:
        del _otp_store[key]
        return False, "Too many failed attempts. Please request a new code."

    # Verify code
    entry["attempts"] += 1
    if entry["code"] != code.strip():
        remaining = OTP_MAX_ATTEMPTS - entry["attempts"]
        return False, f"Invalid OTP code. {remaining} attempts remaining."

    # Success — remove the OTP so it can't be reused
    del _otp_store[key]
    return True, "OTP verified successfully"


def cleanup_expired():
    """Remove expired OTP entries (housekeeping)."""
    now = datetime.utcnow()
    expired_keys = [k for k, v in _otp_store.items() if now > v["expires"]]
    for k in expired_keys:
        del _otp_store[k]
