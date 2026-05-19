# VeriAuto — Phase 1

Trust-first vehicle verification for Australian private car sales.

## What this is

A complete Phase 1 MVP — a seller applies for a verified listing certificate,
you (the operator) run the checks manually, approve or decline, and the system
generates a QR-linked certificate the seller attaches to any listing.

## Project structure

```
veriaut/
├── server.js              # Express backend (API + SQLite)
├── db.js                  # Database schema and queries
├── vite.config.js         # Frontend bundler config
├── index.html             # React app entry point
├── src/
│   ├── App.jsx            # Full seller onboarding UI
│   ├── main.jsx           # React mount
│   └── index.css          # CSS variables
├── scripts/
│   ├── generate_certificate.py   # PDF certificate generator
│   └── requirements.txt
├── emails/
│   └── templates.txt      # All 5 email templates
├── data/                  # SQLite database (auto-created)
├── uploads/               # Seller document uploads (auto-created)
└── .env.example           # Environment variable template
```

## Setup (first time only)

### 1. Install Node dependencies
```bash
npm install
```

### 2. Install Python dependencies
```bash
npm run setup:python
# or manually:
pip install -r scripts/requirements.txt --break-system-packages
```

### 3. Set up environment variables
```bash
cp .env.example .env
# Edit .env and fill in your Stripe link and email credentials
```

## Running the project

```bash
npm run dev
```

This starts two servers concurrently:
- **Frontend** → http://localhost:3000 (the seller-facing React app)
- **Backend**  → http://localhost:4000 (the Express API)

## API reference

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/applications | Seller submits application |
| GET  | /api/applications | List all applications (operator) |
| GET  | /api/applications/:id | Get single application |
| PATCH| /api/applications/:id | Update checks / approve / decline |
| GET  | /api/verify/:certId | Public verification page data |
| GET  | /api/dashboard | Summary stats |

## Operator workflow

### Approve an application
```bash
curl -X PATCH http://localhost:4000/api/applications/YOUR_APP_ID \
  -H "Content-Type: application/json" \
  -d '{
    "payment_confirmed": 1,
    "check_identity": "pass",
    "check_ppsr": "pass",
    "check_rego": "pass",
    "check_odometer": "pass",
    "check_photos": "pass",
    "overall_decision": "approved"
  }'
```

Approving automatically generates the certificate ID, issue/expiry dates,
verify URL, and QR code data.

### Decline an application
```bash
curl -X PATCH http://localhost:4000/api/applications/YOUR_APP_ID \
  -H "Content-Type: application/json" \
  -d '{"overall_decision": "declined", "notes": "PPSR encumbrance detected"}'
```

### Generate a PDF certificate
```bash
python3 scripts/generate_certificate.py \
  --id VCA-0001 \
  --data '{"seller_display":"Mohammed A.","car_year":"2019","car_make":"Toyota","car_model":"Camry","car_vin":"JTDKN3DU4A0000001","car_rego":"ABC123","car_state":"NSW","car_odometer":"87400","verify_url":"http://localhost:3000/verify/VCA-0001","issued_at":"19 May 2026","expires_at":"18 July 2026"}'
```

Output is saved to `data/certificates/VCA-0001.pdf`.

### Check the dashboard
```bash
curl http://localhost:4000/api/dashboard
```

### View all applications
```bash
curl http://localhost:4000/api/applications | python3 -m json.tool
```

## Using Claude Code for further development

Install Claude Code globally:
```bash
npm install -g @anthropic-ai/claude-code
```

Then from this project directory:
```bash
claude
```

Example prompts to use with Claude Code:
- "Add a Stripe webhook handler to auto-confirm payment"
- "Build a simple operator dashboard HTML page"
- "Add nodemailer to send Template 3 email on approval"
- "Add a /verify/:certId page to the React frontend"

## Phase 1 → Phase 2 checklist

When you hit 75+ certificates and $5k/month revenue:
- [ ] Add automated ID verification (Stripe Identity API)
- [ ] Add inspection booking flow
- [ ] Build proper operator dashboard UI
- [ ] Migrate verification pages from manual Notion to /verify/:id route
- [ ] Add Stripe webhook for automatic payment confirmation

## Support

Questions: verify@veriaut.com.au
