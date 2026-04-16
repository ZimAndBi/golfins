"""Notification Service - Main Application"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "mailhog")
SMTP_PORT = int(os.getenv("SMTP_PORT", "1025"))
FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@golfins.local")

def send_email(to: str, subject: str, html_body: str) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.sendmail(FROM_EMAIL, [to], msg.as_string())
        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False

# NOTE: In Python f-strings, literal {{ and }} must be doubled.
EMAIL_TEMPLATES = {
    "policy_active": {
        "subject": "🏌️ Your Golf Insurance Policy is now ACTIVE!",
        "body": lambda data: f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:0;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">
  <div style="background:linear-gradient(135deg,#0f172a,#2563eb);padding:40px 30px;text-align:center">
    <div style="font-size:48px;margin-bottom:12px">🛡️</div>
    <h1 style="color:white;margin:0;font-size:24px;letter-spacing:-0.5px">Certificate of Insurance</h1>
    <p style="color:#bfdbfe;margin:8px 0 0;font-weight:bold;text-transform:uppercase;font-size:12px;letter-spacing:1px">Status: Fully Activated</p>
  </div>
  <div style="background:white;padding:30px">
    <p style="color:#1e293b;font-size:16px">Dear <strong>{data.get('name', 'Valued Customer')}</strong>,</p>
    <p style="color:#475569;line-height:1.6">Congratulations! Your payment has been verified and your insurance coverage is now officially <strong>Active</strong>.</p>
    
    <div style="background:#f8fafc;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #f1f5f9">
        <table style="width:100%;border-collapse:collapse">
            <tr>
                <td style="color:#64748b;font-size:11px;text-transform:uppercase;font-weight:bold;padding-bottom:4px">Policy Number</td>
                <td style="color:#64748b;font-size:11px;text-transform:uppercase;font-weight:bold;padding-bottom:4px;text-align:right">Expiry Date</td>
            </tr>
            <tr>
                <td style="color:#0f172a;font-size:18px;font-weight:black;font-family:monospace">{data.get('policy_number', 'N/A')}</td>
                <td style="color:#0f172a;font-size:15px;font-weight:bold;text-align:right">{data.get('expiry_date', 'N/A')}</td>
            </tr>
        </table>
    </div>

    <div style="text-align:center;margin:32px 0">
        <a href="{data.get('certificate_link', '#')}" style="background:#2563eb;color:white;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:14px">DOWNLOAD E-CERTIFICATE</a>
    </div>

    <p style="color:#64748b;font-size:13px;line-height:1.6;font-style:italic">Please keep this digital certificate for your records.</p>
    
    <hr style="border:none;border-top:1px solid #f1f5f9;margin:30px 0">
    <p style="color:#0f172a;font-weight:bold;margin:0">UIC Insurance Team</p>
    <p style="color:#94a3b8;font-size:11px;margin:4px 0 0">Trusted Protection by UIC</p>
  </div>
</div>
""",
    },
    "policy_purchased": {
        "subject": "Payment Received — Your Golf Insurance Order",
        "body": lambda data: f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #f1f5f9;border-radius:12px">
  <h1 style="color:#1F2937">Purchase Confirmation</h1>
  <p>Dear {data.get('name', 'Valued Customer')},</p>
  <p>Thank you for choosing UIC. We have received your order. Once payment is confirmed, your policy will be activated.</p>
  <div style="background:#f8fafc;padding:20px;border-radius:12px;margin:20px 0;border:1px solid #f1f5f9">
    <p style="margin:5px 0"><strong>Policy Number:</strong> {data.get('policy_number', 'N/A')}</p>
    <p style="margin:5px 0"><strong>Total Premium:</strong> {format(int(float(data.get('premium', 0))), ',').replace(',', '.')} ₫</p>
    <p style="margin:5px 0"><strong>Status:</strong> Processing Verification</p>
  </div>
  <p><strong>UIC Team</strong></p>
</div>
""",
    },
    "claim_submitted": {
        "subject": "Your Claim Has Been Submitted",
        "body": lambda data: f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
  <h1 style="color:#1F2937">Claim Received</h1>
  <p>Dear {data.get('name', 'Valued Customer')},</p>
  <p>We've received your claim. Status: Under Review.</p>
  <p><strong>UIC Team</strong></p>
</div>
""",
    },
    "otp_register": {
        "subject": "Your Registration OTP Code - UIC",
        "body": lambda data: f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #f1f5f9;border-radius:12px">
  <h1 style="color:#1F2937">Verification Code</h1>
  <p>Dear {data.get('name', 'User')},</p>
  <p>Your OTP to complete registration is:</p>
  <div style="background:#f8fafc;padding:20px;border-radius:12px;margin:20px 0;border:1px solid #f1f5f9;text-align:center">
    <p style="margin:0;font-size:32px;letter-spacing:6px;font-weight:bold;color:#2563eb">{data.get('otp_code', 'N/A')}</p>
  </div>
  <p>This code will expire in {data.get('ttl_minutes', 5)} minutes. Please do not share it with anyone.</p>
  <p><strong>UIC Team</strong></p>
</div>
""",
    },
    "otp_reset_password": {
        "subject": "Your Password Reset Code - UIC",
        "body": lambda data: f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #f1f5f9;border-radius:12px">
  <h1 style="color:#1F2937">Password Reset</h1>
  <p>Dear {data.get('name', 'User')},</p>
  <p>Your OTP to reset your password is:</p>
  <div style="background:#f8fafc;padding:20px;border-radius:12px;margin:20px 0;border:1px solid #f1f5f9;text-align:center">
    <p style="margin:0;font-size:32px;letter-spacing:6px;font-weight:bold;color:#ef4444">{data.get('otp_code', 'N/A')}</p>
  </div>
  <p>This code will expire in {data.get('ttl_minutes', 5)} minutes. If you didn't request this, please ignore this email.</p>
  <p><strong>UIC Team</strong></p>
</div>
""",
    },
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting Notification Service — SMTP: {SMTP_HOST}:{SMTP_PORT}")
    yield
    logger.info("Stopping Notification Service")

app = FastAPI(title="Notification Service", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "notification-service"}

@app.post("/api/v1/notifications/send")
async def send_notification(data: dict):
    recipient = data.get("recipient_email", "")
    template_name = data.get("template", "")
    template_data = data.get("data", {})
    notification_id = str(uuid.uuid4())

    if not recipient:
        return {"notification_id": notification_id, "status": "failed", "error": "No recipient"}

    if template_name and template_name in EMAIL_TEMPLATES:
        tmpl = EMAIL_TEMPLATES[template_name]
        subject = tmpl["subject"]
        body = tmpl["body"](template_data)
    else:
        subject = data.get("subject", "Notification from UIC")
        body = f"<p>{data.get('message', '')}</p>"

    success = send_email(recipient, subject, body)

    return {
        "notification_id": notification_id,
        "recipient": recipient,
        "status": "sent" if success else "failed",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
