// db.js — SQLite via sql.js (pure JavaScript, no native build required)
import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir   = join(__dirname, 'data');
const dbPath    = join(dataDir, 'veriaut.db');
mkdirSync(dataDir, { recursive: true });

const SQL = await initSqlJs();
let db;
if (existsSync(dbPath)) {
  db = new SQL.Database(readFileSync(dbPath));
} else {
  db = new SQL.Database();
}

function persist() { writeFileSync(dbPath, db.export()); }

db.run(`
  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY, certificate_id TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    payment_confirmed INTEGER NOT NULL DEFAULT 0,
    seller_name TEXT NOT NULL, seller_email TEXT NOT NULL,
    seller_mobile TEXT NOT NULL, seller_suburb TEXT,
    car_make TEXT NOT NULL, car_model TEXT NOT NULL,
    car_year TEXT NOT NULL, car_vin TEXT NOT NULL,
    car_rego TEXT NOT NULL, car_state TEXT NOT NULL,
    car_odometer TEXT, car_price TEXT,
    check_identity TEXT NOT NULL DEFAULT 'pending',
    check_ppsr TEXT NOT NULL DEFAULT 'pending',
    check_rego TEXT NOT NULL DEFAULT 'pending',
    check_odometer TEXT NOT NULL DEFAULT 'pending',
    check_photos TEXT NOT NULL DEFAULT 'pending',
    overall_decision TEXT NOT NULL DEFAULT 'pending',
    issued_at TEXT, expires_at TEXT, verify_url TEXT, qr_code_data TEXT,
    notes TEXT, car_sold INTEGER NOT NULL DEFAULT 0,
    upload_keys TEXT
  )
`);

try { db.run(`ALTER TABLE applications ADD COLUMN upload_keys TEXT`); } catch (_) { /* column exists */ }
persist();

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  const rows = [];
  stmt.bind(params);
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) { db.run(sql, params); persist(); }

export function insertApplication(data) {
  run(`INSERT INTO applications (id,seller_name,seller_email,seller_mobile,seller_suburb,car_make,car_model,car_year,car_vin,car_rego,car_state,car_odometer,car_price) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [data.id,data.seller_name,data.seller_email,data.seller_mobile,data.seller_suburb,data.car_make,data.car_model,data.car_year,data.car_vin,data.car_rego,data.car_state,data.car_odometer,data.car_price]);
}

export function getAllApplications() {
  return query('SELECT * FROM applications ORDER BY created_at DESC');
}

export function getApplicationById(id) {
  return query('SELECT * FROM applications WHERE id = ?', [id])[0] || null;
}

export function getApplicationByCertId(certId) {
  return query('SELECT * FROM applications WHERE certificate_id = ?', [certId])[0] || null;
}

export function updateApplication(id, fields) {
  const allowed = ['payment_confirmed','check_identity','check_ppsr','check_rego','check_odometer','check_photos','overall_decision','certificate_id','issued_at','expires_at','verify_url','qr_code_data','notes','car_sold','upload_keys'];
  const keys = Object.keys(fields).filter(k => allowed.includes(k));
  if (!keys.length) return;
  run(`UPDATE applications SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`, [...keys.map(k => fields[k]), id]);
}

export function getExpiringApplications() {
  return query(`SELECT * FROM applications WHERE overall_decision='approved' AND expires_at IS NOT NULL AND date(expires_at) <= date('now','+7 days') AND date(expires_at) >= date('now')`);
}

export default db;
