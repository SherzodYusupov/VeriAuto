// server.js — VeriAuto Phase 1 Backend
import 'dotenv/config';
import express        from 'express';
import cors           from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath }  from 'url';
import { mkdirSync }      from 'fs';
import { v4 as uuidv4 }   from 'uuid';
import QRCode             from 'qrcode';
import multer             from 'multer';

import { insertApplication, getAllApplications, getApplicationById, getApplicationByCertId, updateApplication, getExpiringApplications } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT      = process.env.PORT || 4000;
const BASE_URL  = process.env.BASE_URL || `http://localhost:3000`;

// ── Upload storage ─────────────────────────────────────────────────────────────
const uploadsDir = join(__dirname, 'uploads');
mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const appDir = join(uploadsDir, req.params.id || 'temp');
    mkdirSync(appDir, { recursive: true });
    cb(null, appDir);
  },
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// ── Helper: generate certificate ID ──────────────────────────────────────────
function nextCertId() {
  const all = getAllApplications();
  const issued = all.filter(a => a.certificate_id).length;
  return `VCA-${String(issued + 1).padStart(4, '0')}`;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/applications — seller submits application
app.post('/api/applications', (req, res) => {
  try {
    const { seller, car, declarations, uploads } = req.body;

    // Basic validation
    if (!seller?.name || !seller?.email || !seller?.mobile) {
      return res.status(400).json({ error: 'Seller name, email, and mobile are required.' });
    }
    if (!car?.vin || car.vin.length !== 17) {
      return res.status(400).json({ error: 'VIN must be exactly 17 characters.' });
    }
    if (!declarations || !declarations.every(Boolean)) {
      return res.status(400).json({ error: 'All declarations must be confirmed.' });
    }

    const id = uuidv4();
    insertApplication({
      id,
      seller_name:   seller.name,
      seller_email:  seller.email,
      seller_mobile: seller.mobile,
      seller_suburb: seller.suburb || null,
      car_make:      car.make,
      car_model:     car.model,
      car_year:      car.year,
      car_vin:       car.vin.toUpperCase(),
      car_rego:      car.rego.toUpperCase(),
      car_state:     car.state,
      car_odometer:  car.odo  || null,
      car_price:     car.price || null,
    });

    console.log(`\n✅ New application: ${id}`);
    console.log(`   Seller: ${seller.name} <${seller.email}>`);
    console.log(`   Car:    ${car.year} ${car.make} ${car.model} — ${car.vin}`);
    console.log(`   Status: awaiting payment confirmation\n`);

    return res.status(201).json({
      id,
      message: 'Application received. Proceed to payment.',
      stripeUrl: process.env.STRIPE_PAYMENT_LINK || '#',
    });
  } catch (err) {
    console.error('Application error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/applications/:id/upload — upload documents for an application
app.post('/api/applications/:id/upload', upload.array('files'), (req, res) => {
  const app_ = getApplicationById(req.params.id);
  if (!app_) return res.status(404).json({ error: 'Application not found.' });
  return res.json({ uploaded: req.files.map(f => f.originalname) });
});

// GET /api/applications — operator: list all applications
app.get('/api/applications', (req, res) => {
  const rows = getAllApplications();
  return res.json(rows);
});

// GET /api/applications/expiring — operator: applications expiring in 7 days
app.get('/api/applications/expiring', (req, res) => {
  return res.json(getExpiringApplications());
});

// GET /api/applications/:id — operator: get one application
app.get('/api/applications/:id', (req, res) => {
  const row = getApplicationById(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found.' });
  return res.json(row);
});

// PATCH /api/applications/:id — operator: update checks or decision
app.patch('/api/applications/:id', async (req, res) => {
  const row = getApplicationById(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found.' });

  const updates = { ...req.body };

  // If approving, auto-generate certificate ID, dates, QR code
  if (req.body.overall_decision === 'approved' && !row.certificate_id) {
    const certId     = nextCertId();
    const issuedAt   = new Date().toISOString().split('T')[0];
    const expiresAt  = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const verifyUrl  = `${BASE_URL}/verify/${certId}`;
    const qrCodeData = await QRCode.toDataURL(verifyUrl);

    updates.certificate_id = certId;
    updates.issued_at      = issuedAt;
    updates.expires_at     = expiresAt;
    updates.verify_url     = verifyUrl;
    updates.qr_code_data   = qrCodeData;

    console.log(`\n🎉 Certificate issued: ${certId}`);
    console.log(`   Seller: ${row.seller_name}`);
    console.log(`   Car:    ${row.car_year} ${row.car_make} ${row.car_model}`);
    console.log(`   URL:    ${verifyUrl}`);
    console.log(`   Expiry: ${expiresAt}\n`);
  }

  updateApplication(req.params.id, updates);
  return res.json(getApplicationById(req.params.id));
});

// GET /api/verify/:certId — public: buyer scans QR code
app.get('/api/verify/:certId', (req, res) => {
  const row = getApplicationByCertId(req.params.certId);
  if (!row || row.overall_decision !== 'approved') {
    return res.status(404).json({ error: 'Certificate not found.' });
  }

  const now       = new Date();
  const expiresAt = new Date(row.expires_at);
  const expired   = now > expiresAt;

  return res.json({
    status:         expired ? 'expired' : 'valid',
    certificate_id: row.certificate_id,
    issued_at:      row.issued_at,
    expires_at:     row.expires_at,
    seller_display: row.seller_name.split(' ')[0] + ' ' +
                    (row.seller_name.split(' ')[1]?.[0] || '') + '.',
    vehicle: {
      year:  row.car_year,
      make:  row.car_make,
      model: row.car_model,
      vin:   row.car_vin,
      rego:  `${row.car_rego} (${row.car_state})`,
      odo:   row.car_odometer ? `${parseInt(row.car_odometer).toLocaleString()} km` : null,
    },
    checks: {
      identity:     row.check_identity,
      ppsr:         row.check_ppsr,
      registration: row.check_rego,
      odometer:     row.check_odometer,
      photos:       row.check_photos,
    },
  });
});

// GET /api/dashboard — operator summary stats
app.get('/api/dashboard', (req, res) => {
  const all      = getAllApplications();
  const approved = all.filter(a => a.overall_decision === 'approved');
  const pending  = all.filter(a => a.overall_decision === 'pending');
  const declined = all.filter(a => a.overall_decision === 'declined');
  const expiring = getExpiringApplications();

  return res.json({
    total:          all.length,
    approved:       approved.length,
    pending:        pending.length,
    declined:       declined.length,
    expiring_soon:  expiring.length,
    revenue_est:    approved.length * 99,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚗 VeriAuto backend running on http://localhost:${PORT}`);
  console.log(`   Frontend proxy → http://localhost:3000`);
  console.log(`   Dashboard:      GET  /api/dashboard`);
  console.log(`   Applications:   GET  /api/applications`);
  console.log(`   New app:        POST /api/applications\n`);
});
