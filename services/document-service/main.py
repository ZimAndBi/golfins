"""Document Service - PDF Certificate Generation"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
import logging
import uuid
import io
import os
from datetime import datetime, timedelta

import httpx
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import qrcode

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

POLICY_SERVICE_URL = os.getenv("POLICY_SERVICE_URL", "http://policy-service:8000")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8000")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Document Service")
    yield
    logger.info("Stopping Document Service")


app = FastAPI(title="Document Service", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "document-service"}


def _draw_certificate(c: canvas.Canvas, policy: dict, user: dict) -> None:
    """Draw the insurance certificate onto the canvas."""
    width, height = A4  # 595 x 842 pts

    # ── Background ──────────────────────────────────────────────────────────
    c.setFillColor(colors.HexColor("#0f172a"))
    c.rect(0, height - 120, width, 120, fill=1, stroke=0)

    # ── Header ──────────────────────────────────────────────────────────────
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 28)
    c.drawString(30, height - 55, "GOLFINS")
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawString(30, height - 75, "Golf Insurance Certificate")

    # cert number top-right
    cert_id = str(uuid.uuid4())[:8].upper()
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawRightString(width - 30, height - 50, f"Certificate #{cert_id}")
    c.drawRightString(width - 30, height - 65, f"Issued: {datetime.utcnow().strftime('%d %b %Y')}")

    # ── Accent bar ───────────────────────────────────────────────────────────
    c.setFillColor(colors.HexColor("#10b981"))
    c.rect(0, height - 124, width, 4, fill=1, stroke=0)

    # ── Policy number band ───────────────────────────────────────────────────
    y = height - 175
    c.setFillColor(colors.HexColor("#f0fdf4"))
    c.roundRect(25, y - 10, width - 50, 55, 8, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#166534"))
    c.setFont("Helvetica", 10)
    c.drawString(45, y + 30, "POLICY NUMBER")
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawString(45, y + 8, policy.get("policy_number", "N/A"))

    status = policy.get("status", "unknown").upper()
    status_color = colors.HexColor("#10b981") if status == "ACTIVE" else colors.HexColor("#f59e0b")
    c.setFillColor(status_color)
    c.roundRect(width - 110, y + 5, 80, 22, 5, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(width - 70, y + 11, status)

    # ── Insured details ──────────────────────────────────────────────────────
    y_section = y - 40
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 13)
    c.drawString(30, y_section, "Insured Details")
    c.setFillColor(colors.HexColor("#10b981"))
    c.rect(30, y_section - 4, 60, 2, fill=1, stroke=0)

    first = user.get("first_name", "")
    last = user.get("last_name", "")
    full_name = f"{first} {last}".strip() or "Valued Customer"
    email = user.get("email", "")

    _field_row(c, 30, y_section - 30, "Policyholder", full_name)
    _field_row(c, 30, y_section - 52, "Email", email)
    _field_row(c, 30, y_section - 74, "Policy Type", "Golf Insurance")

    # ── Coverage & premium ───────────────────────────────────────────────────
    y_section2 = y_section - 110
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 13)
    c.drawString(30, y_section2, "Coverage Details")
    c.setFillColor(colors.HexColor("#10b981"))
    c.rect(30, y_section2 - 4, 70, 2, fill=1, stroke=0)

    created_at = policy.get("created_at", "")
    try:
        issue_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        issue_str = issue_dt.strftime("%d %b %Y")
        expiry_str = (issue_dt + timedelta(days=365)).strftime("%d %b %Y")
    except Exception:
        issue_str = datetime.utcnow().strftime("%d %b %Y")
        expiry_str = (datetime.utcnow() + timedelta(days=365)).strftime("%d %b %Y")

    premium = policy.get("premium_amount", 0)
    try:
        premium_str = f"${float(premium):.2f}"
    except Exception:
        premium_str = f"${premium}"

    _field_row(c, 30, y_section2 - 30, "Annual Premium", premium_str)
    _field_row(c, 30, y_section2 - 52, "Issue Date", issue_str)
    _field_row(c, 30, y_section2 - 74, "Expiry Date", expiry_str)
    _field_row(c, 30, y_section2 - 96, "Coverage Territory", "Worldwide")

    # ── Coverage items ───────────────────────────────────────────────────────
    items = [
        "Equipment Loss & Damage",
        "Personal Liability on Course",
        "Golf Buggy Damage",
        "Hole-in-One Expenses",
        "Medical Expenses (on course)",
    ]
    y_items = y_section2 - 130
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(30, y_items, "Covered Events")
    for i, item in enumerate(items):
        yi = y_items - 20 - i * 18
        c.setFillColor(colors.HexColor("#10b981"))
        c.circle(40, yi + 4, 3, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#334155"))
        c.setFont("Helvetica", 10)
        c.drawString(50, yi, item)

    # ── QR Code ──────────────────────────────────────────────────────────────
    qr_data = f"https://golfins.com/verify/{policy.get('id', cert_id)}"
    qr_img = qrcode.make(qr_data)
    qr_buf = io.BytesIO()
    qr_img.save(qr_buf, format="PNG")
    qr_buf.seek(0)

    qr_x = width - 120
    qr_y = y_section2 - 150
    c.drawImage(
        ImageReader(qr_buf), qr_x, qr_y, width=90, height=90,
        preserveAspectRatio=True
    )
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(qr_x + 45, qr_y - 12, "Scan to verify")

    # ── Footer ───────────────────────────────────────────────────────────────
    c.setFillColor(colors.HexColor("#f1f5f9"))
    c.rect(0, 0, width, 50, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(width / 2, 30, "Golfins Insurance Pty Ltd  |  ABN 00 000 000 000  |  AFS Licence 000000")
    c.drawCentredString(width / 2, 18, "This certificate is issued subject to the terms and conditions of the Golf Insurance Product Disclosure Statement.")
    c.drawCentredString(width / 2, 6, f"Document generated {datetime.utcnow().strftime('%d %b %Y %H:%M')} UTC")


def _field_row(c: canvas.Canvas, x: float, y: float, label: str, value: str) -> None:
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.drawString(x, y + 11, label.upper())
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawString(x, y, value)


@app.get("/api/v1/documents/certificate/{policy_id}")
async def download_certificate(policy_id: str):
    """Generate and return a PDF insurance certificate for a policy."""

    # Fetch policy from policy service
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{POLICY_SERVICE_URL}/api/v1/policies/{policy_id}")
            if resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Policy not found")
            policy = resp.json()
        except httpx.RequestError as e:
            logger.error(f"Failed to fetch policy {policy_id}: {e}")
            raise HTTPException(status_code=503, detail="Policy service unavailable")

        # Fetch user info (best-effort)
        user: dict = {}
        user_id = policy.get("user_id")
        if user_id:
            try:
                u_resp = await client.get(f"{AUTH_SERVICE_URL}/api/v1/auth/admin/users")
                if u_resp.status_code == 200:
                    users = u_resp.json().get("users", [])
                    user = next((u for u in users if u.get("id") == user_id), {})
            except Exception:
                pass  # non-fatal

    # Generate PDF in memory
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    _draw_certificate(c, policy, user)
    c.save()
    buf.seek(0)

    policy_number = policy.get("policy_number", policy_id).replace("/", "-")
    filename = f"certificate-{policy_number}.pdf"

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/v1/documents/generate-certificate")
async def generate_certificate(data: dict):
    """Legacy endpoint — redirect to GET certificate download."""
    policy_id = data.get("policy_id")
    if not policy_id:
        raise HTTPException(status_code=400, detail="policy_id required")
    return {
        "document_id": str(uuid.uuid4()),
        "policy_id": policy_id,
        "certificate_url": f"/api/documents/certificate/{policy_id}",
        "generated_at": datetime.utcnow().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
