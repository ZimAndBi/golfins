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

EMAIL_TEMPLATES = {
    "policy_purchased": {
        "subject": "Your Golf Insurance Policy is Active!",
        "body": lambda data: f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
  <h1 style="color:#1F2937">Golf Insurance Policy Confirmed</h1>
  <p>Dear {data.get('name', 'Valued Customer')},</p>
  <p>Your golf insurance policy has been successfully purchased and is now <strong>active</strong>.</p>
  <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0">
    <p><strong>Policy Number:</strong> {data.get('policy_number', 'N/A')}</p>
    <p><strong>Premium:</strong> ${data.get('premium', 'N/A')}</p>
    <p><strong>Status:</strong> Active</p>
  </div>
  <p>You can view your policy at any time by logging into your account.</p>
  <p style="color:#059669"><strong>Golfins Team</strong></p>
</div>
""",
    },
    "claim_submitted": {
        "subject": "Your Claim Has Been Submitted",
        "body": lambda data: f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
  <h1 style="color:#1F2937">Claim Received</h1>
  <p>Dear {data.get('name', 'Valued Customer')},</p>
  <p>We have received your insurance claim and it is now under review.</p>
  <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0">
    <p><strong>Claim Number:</strong> {data.get('claim_number', 'N/A')}</p>
    <p><strong>Amount Requested:</strong> ${data.get('amount', 'N/A')}</p>
    <p><strong>Status:</strong> Submitted</p>
  </div>
  <p>Our team will review your claim and get back to you within 3-5 business days.</p>
  <p style="color:#059669"><strong>Golfins Team</strong></p>
</div>
""",
    },
    "hoi_approved": {
        "subject": "🏌️ Hole-in-One Claim Approved — Congratulations!",
        "body": lambda data: f"""
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
  <div style="background:linear-gradient(135deg,#1F2937,#065f46);padding:30px;border-radius:12px;text-align:center;margin-bottom:24px">
    <div style="font-size:64px">⛳</div>
    <h1 style="color:white;margin:12px 0">HOLE IN ONE!</h1>
    <p style="color:#6ee7b7;font-size:18px">Congratulations, {data.get('name', 'Golfer')}!</p>
  </div>
  <p>What an incredible achievement! Your Hole-in-One claim has been <strong style="color:#059669">automatically approved</strong>.</p>
  <div style="background:#f0fdf4;border:2px solid #86efac;padding:20px;border-radius:8px;margin:20px 0">
    <p><strong>Claim Number:</strong> {data.get('claim_number', 'N/A')}</p>
    <p><strong>Course:</strong> {data.get('course_name', 'N/A')}</p>
    <p><strong>Hole:</strong> #{data.get('hole_number', 'N/A')}</p>
    <p><strong>Celebration Amount:</strong> ${data.get('amount', '0')}</p>
    <p><strong>Status:</strong> <span style="color:#059669;font-weight:bold">Approved ✓</span></p>
  </div>
  <p>Your celebration expenses will be reimbursed within 2-3 business days. Enjoy the round of drinks — you've earned it!</p>
  <p style="color:#059669"><strong>Golfins Team</strong></p>
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
    """Send email notification"""
    recipient = data.get("recipient_email", "")
    template_name = data.get("template", "")
    template_data = data.get("data", {})
    notification_id = str(uuid.uuid4())

    if not recipient:
        return {"notification_id": notification_id, "status": "failed", "error": "No recipient"}

    # Use template if specified, otherwise use raw subject/message
    if template_name and template_name in EMAIL_TEMPLATES:
        tmpl = EMAIL_TEMPLATES[template_name]
        subject = tmpl["subject"]
        body = tmpl["body"](template_data)
    else:
        subject = data.get("subject", "Notification from Golfins")
        body = f"<p>{data.get('message', '')}</p>"

    success = send_email(recipient, subject, body)

    return {
        "notification_id": notification_id,
        "recipient": recipient,
        "type": "email",
        "status": "sent" if success else "failed",
        "sent_at": datetime.utcnow().isoformat(),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
