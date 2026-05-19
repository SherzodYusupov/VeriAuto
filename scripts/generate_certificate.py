#!/usr/bin/env python3
"""
generate_certificate.py — VeriAuto Phase 1
Generates a PDF Verified Listing Certificate from application data.

Usage:
  python3 scripts/generate_certificate.py --id VCA-0001 --data '{"seller":...}'
  python3 scripts/generate_certificate.py --id VCA-0001 --json data/VCA-0001.json
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

try:
    import qrcode
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader
    from io import BytesIO
except ImportError:
    print("Missing dependencies. Run: pip install reportlab qrcode[pil] pillow --break-system-packages")
    sys.exit(1)

# ── Brand colours ─────────────────────────────────────────────────────────────
CORAL       = colors.HexColor("#D85A30")
CORAL_LIGHT = colors.HexColor("#FAECE7")
TEAL        = colors.HexColor("#1D9E75")
TEAL_LIGHT  = colors.HexColor("#E1F5EE")
DARK        = colors.HexColor("#2C2C2A")
GRAY        = colors.HexColor("#5F5E5A")
LIGHT_GRAY  = colors.HexColor("#F5F5F4")
WHITE       = colors.white

PAGE_W, PAGE_H = A4  # 595 x 842 points


def generate_qr(url: str) -> BytesIO:
    """Generate QR code as an in-memory PNG."""
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1D9E75", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def draw_certificate(c: canvas.Canvas, data: dict):
    w, h = PAGE_W, PAGE_H
    margin = 20 * mm

    # ── Background ────────────────────────────────────────────────────────────
    c.setFillColor(WHITE)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Top coral bar
    c.setFillColor(CORAL)
    c.rect(0, h - 18 * mm, w, 18 * mm, fill=1, stroke=0)

    # ── Logo / header text ────────────────────────────────────────────────────
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(margin, h - 12 * mm, "VeriAuto")
    c.setFont("Helvetica", 10)
    c.drawRightString(w - margin, h - 10 * mm, "veriaut.com.au")
    c.drawRightString(w - margin, h - 14 * mm, "Verified Listing Certificate")

    # ── Certificate ID band ───────────────────────────────────────────────────
    c.setFillColor(LIGHT_GRAY)
    c.rect(0, h - 30 * mm, w, 12 * mm, fill=1, stroke=0)
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(margin, h - 25 * mm, f"Certificate ID: {data['certificate_id']}")
    c.setFont("Helvetica", 10)
    c.setFillColor(GRAY)
    c.drawRightString(w - margin, h - 25 * mm,
                      f"Issued: {data['issued_at']}   ·   Valid until: {data['expires_at']}")

    # ── Vehicle section ───────────────────────────────────────────────────────
    y = h - 42 * mm
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 16)
    vehicle_str = f"{data['car_year']} {data['car_make']} {data['car_model']}"
    c.drawString(margin, y, vehicle_str)

    y -= 7 * mm
    c.setFont("Helvetica", 10)
    c.setFillColor(GRAY)
    c.drawString(margin, y, f"VIN: {data['car_vin']}   ·   Rego: {data['car_rego']} ({data['car_state']})")
    if data.get('car_odometer'):
        y -= 5 * mm
        c.drawString(margin, y, f"Odometer: {int(data['car_odometer']):,} km (verified {data['issued_at']})")

    y -= 5 * mm
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 9)
    c.drawString(margin, y, f"Listed by: {data['seller_display']}  (identity verified)")

    # Divider
    y -= 8 * mm
    c.setStrokeColor(colors.HexColor("#E8E8E8"))
    c.setLineWidth(0.5)
    c.line(margin, y, w - margin, y)

    # ── Verification checks ───────────────────────────────────────────────────
    y -= 10 * mm
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, y, "Verification Results")

    checks = [
        ("Identity verified",    "Government-issued ID checked and confirmed"),
        ("Ownership confirmed",  "Registration certificate matched to seller identity"),
        ("PPSR: Clear",          "No security interests found — no money owing on this vehicle"),
        ("Registration current", "Confirmed current via state government portal"),
        ("Odometer verified",    "Photo reviewed and cross-referenced with vehicle history"),
        ("Photos reviewed",      "Condition consistent with listing description"),
    ]

    y -= 8 * mm
    for label, desc in checks:
        # Tick circle
        c.setFillColor(TEAL)
        c.circle(margin + 4 * mm, y + 1 * mm, 3.5 * mm, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("ZapfDingbats", 8)
        c.drawCentredString(margin + 4 * mm, y - 0.5 * mm, "\x33")  # checkmark

        # Text
        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin + 10 * mm, y + 2 * mm, label)
        c.setFillColor(GRAY)
        c.setFont("Helvetica", 9)
        c.drawString(margin + 10 * mm, y - 2.5 * mm, desc)

        y -= 12 * mm

    # Divider
    y -= 3 * mm
    c.setStrokeColor(colors.HexColor("#E8E8E8"))
    c.line(margin, y, w - margin, y)

    # ── QR code ───────────────────────────────────────────────────────────────
    qr_size   = 35 * mm
    qr_x      = w - margin - qr_size
    qr_y      = y - qr_size - 5 * mm

    qr_buf = generate_qr(data['verify_url'])
    c.drawImage(ImageReader(qr_buf), qr_x, qr_y, qr_size, qr_size)

    # QR label
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 7)
    c.drawCentredString(qr_x + qr_size / 2, qr_y - 4 * mm, "Scan to verify authenticity")

    # ── What this means ───────────────────────────────────────────────────────
    text_y = y - 8 * mm
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin, text_y, "What this certificate confirms")

    text_y -= 6 * mm
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 9)
    lines = [
        "VeriAuto has independently verified the seller's identity against government-issued ID,",
        "confirmed ownership via the registration certificate, and run a PPSR search confirming",
        "no finance company holds a security interest in this vehicle.",
    ]
    for line in lines:
        c.drawString(margin, text_y, line)
        text_y -= 5 * mm

    # ── Disclaimer ────────────────────────────────────────────────────────────
    disclaimer_y = 20 * mm
    c.setFillColor(CORAL_LIGHT)
    c.roundRect(margin, disclaimer_y - 2 * mm, w - 2 * margin, 14 * mm, 3 * mm, fill=1, stroke=0)
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(margin + 4 * mm, disclaimer_y + 7 * mm, "Important:")
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#711B0C"))
    c.drawString(margin + 22 * mm, disclaimer_y + 7 * mm,
                 "This certificate is not a mechanical inspection and does not assess roadworthiness or mechanical condition.")
    c.drawString(margin + 4 * mm, disclaimer_y + 2 * mm,
                 f"Verify this certificate at: {data['verify_url']}")

    # Bottom bar
    c.setFillColor(DARK)
    c.rect(0, 0, w, 8 * mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 7)
    c.drawString(margin, 2.5 * mm, "VeriAuto  ·  veriaut.com.au  ·  verify@veriaut.com.au  ·  Sydney, NSW, Australia")
    c.drawRightString(w - margin, 2.5 * mm, f"© {datetime.now().year} VeriAuto. All rights reserved.")


def generate(data: dict, output_path: str):
    c = canvas.Canvas(output_path, pagesize=A4)
    c.setTitle(f"VeriAuto Certificate {data['certificate_id']}")
    c.setAuthor("VeriAuto")
    draw_certificate(c, data)
    c.save()
    print(f"✅ Certificate saved: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Generate VeriAuto PDF certificate")
    parser.add_argument("--id",     required=True, help="Certificate ID e.g. VCA-0001")
    parser.add_argument("--data",   help="JSON string of application data")
    parser.add_argument("--json",   help="Path to JSON file with application data")
    parser.add_argument("--out",    help="Output directory (default: data/certificates)")
    args = parser.parse_args()

    if args.json:
        with open(args.json) as f:
            data = json.load(f)
    elif args.data:
        data = json.loads(args.data)
    else:
        print("Error: provide --data or --json")
        sys.exit(1)

    data.setdefault("certificate_id", args.id)
    data.setdefault("issued_at",      datetime.now().strftime("%d %B %Y"))
    data.setdefault("expires_at",     (datetime.now() + timedelta(days=60)).strftime("%d %B %Y"))
    data.setdefault("verify_url",     f"https://veriaut.com.au/verify/{args.id}")
    data.setdefault("seller_display", "Seller (verified)")

    out_dir = args.out or "data/certificates"
    os.makedirs(out_dir, exist_ok=True)
    output_path = os.path.join(out_dir, f"{args.id}.pdf")
    generate(data, output_path)


if __name__ == "__main__":
    main()
