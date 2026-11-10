import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { hashPassword } from "./password";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'verifier',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  venue TEXT,
  show_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  max_tickets INTEGER NOT NULL DEFAULT 4,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  price INTEGER NOT NULL,
  is_open INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0,
  UNIQUE(event_id, code)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  event_id INTEGER NOT NULL REFERENCES events(id),
  event_name TEXT NOT NULL,
  show_at TEXT,
  ticket_type TEXT NOT NULL,
  section_code TEXT NOT NULL,
  section_price INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  total INTEGER NOT NULL,
  backup_sections TEXT NOT NULL DEFAULT '[]',
  full_name TEXT NOT NULL,
  x_username TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  nik TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_by TEXT,
  verified_at TEXT,
  internal_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(code);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: "Joki Ta Mas?",
  site_tagline: "Joki War Tiket Konser",
  wa_number: "6281232559486",
  wa_number_2: "6281216339241",
  x_username: "tidak_berubah",
  qris_merchant: "Aryan Store",
  qris_nmid: "ID1025405000338",
  qris_image: "/qris.jpg",
  qris_note:
    "Scan dengan aplikasi pembayaran apa pun yang mendukung QRIS.",
  payment_note:
    "Bayar sesuai total tagihan melalui QRIS, lalu kirim bukti pembayaran ke admin melalui WhatsApp. Admin akan memverifikasi secara manual.",
  terms:
    "Pastikan data identitas (Nama, NIK, No HP) sesuai dengan KTP/ID asli pemegang tiket.\nSiapkan saldo pada aplikasi pembayaran yang mendukung QRIS saat war tiket berlangsung.\nJangan double joki untuk pesanan tiket yang sama.\nPembayaran fee joki diverifikasi manual oleh admin.",
  orders_open: "1",
  announcement: "",
};

type GlobalDb = typeof globalThis & { __jtmDb?: Database.Database };

function now(): string {
  return new Date().toISOString();
}

function seed(db: Database.Database) {
  const insertSetting = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
  );
  const seedSettings = db.transaction(() => {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      insertSetting.run(key, value);
    }
  });
  seedSettings();

  const userCount = (
    db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number }
  ).c;

  if (userCount === 0) {
    const email = process.env.ADMIN_EMAIL || "admin@jokitamas.local";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const name = process.env.ADMIN_NAME || "Admin Joki Ta Mas?";
    db.prepare(
      "INSERT INTO users (name, email, password_hash, role, active, created_at) VALUES (?, ?, ?, 'admin', 1, ?)",
    ).run(name, email, hashPassword(password), now());
  }

  const eventCount = (
    db.prepare("SELECT COUNT(*) AS c FROM events").get() as { c: number }
  ).c;

  if (eventCount === 0) {
    const createEvent = db.transaction(() => {
      const info = db
        .prepare(
          "INSERT INTO events (name, venue, show_at, is_active, max_tickets, created_at) VALUES (?, ?, ?, 1, 4, ?)",
        )
        .run(
          "AYO SENYUMLAH | JKT48 15th Anniversary Concert",
          "Surabaya",
          "2026-12-19T18:30:00+07:00",
          now(),
        );
      const eventId = Number(info.lastInsertRowid);
      const sections: Array<[string, number, number]> = [
        ["CAT 1", 400000, 0],
        ["CAT 2", 350000, 1],
        ["CAT 3", 320000, 1],
        ["CAT 4", 300000, 1],
        ["CAT 5", 250000, 1],
        ["CAT 6", 220000, 1],
        ["CAT 7", 200000, 1],
      ];
      const insertSection = db.prepare(
        "INSERT INTO sections (event_id, code, price, is_open, sort) VALUES (?, ?, ?, ?, ?)",
      );
      sections.forEach(([code, price, isOpen], index) => {
        insertSection.run(eventId, code, price, isOpen, index);
      });
    });
    createEvent();
  }
}

export function getDb(): Database.Database {
  const g = globalThis as GlobalDb;
  if (g.__jtmDb) return g.__jtmDb;

  const file =
    process.env.DATABASE_PATH ||
    path.join(process.cwd(), "data", "jokitamas.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  seed(db);

  g.__jtmDb = db;
  return db;
}
