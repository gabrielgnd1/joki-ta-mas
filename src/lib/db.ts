import { createClient, type Client } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { hashPassword } from "./password";
import { MEMBER_TEAMS } from "./members";

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

CREATE TABLE IF NOT EXISTS service_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  items TEXT NOT NULL,
  item_count INTEGER NOT NULL,
  ticket_count INTEGER NOT NULL,
  total INTEGER NOT NULL,
  service_types TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  jkt_email TEXT NOT NULL,
  jkt_password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  verified_by TEXT,
  verified_at TEXT,
  internal_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_created ON service_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_service_orders_code ON service_orders(code);

CREATE TABLE IF NOT EXISTS member_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team TEXT NOT NULL,
  nickname TEXT NOT NULL,
  full_name TEXT NOT NULL,
  price_2s INTEGER NOT NULL,
  mng_low INTEGER NOT NULL,
  mng_high INTEGER NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  UNIQUE(team, nickname)
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
  ticket_ofc_enabled: "1",
  ticket_general_enabled: "1",
  announcement: "",
};

type GlobalDb = typeof globalThis & {
  __jtmClient?: Client;
  __jtmInit?: Promise<void>;
};

/**
 * Rename nickname member yang sudah ada di database.
 *
 * `nickname` dipakai sebagai kunci sinkronisasi seed (`team + nickname`),
 * jadi rename WAJIB dijalankan SEBELUM `INSERT OR IGNORE` — kalau tidak,
 * member lama akan muncul lagi dengan nama lama di samping nama baru.
 */
const MEMBER_RENAMES: Array<{ team: string; from: string; to: string }> = [
  {
    team: "TEAM LOVE",
    from: "Nayla",
    to: "Nayla Kawaii Katanya Sayang gndsparkling",
  },
];

function now(): string {
  return new Date().toISOString();
}

function getClient(): Client {
  const g = globalThis as GlobalDb;
  if (g.__jtmClient) return g.__jtmClient;

  const remoteUrl =
    process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "";

  if (remoteUrl) {
    g.__jtmClient = createClient({
      url: remoteUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return g.__jtmClient;
  }

  const file =
    process.env.DATABASE_PATH ||
    path.join(process.cwd(), "data", "jokitamas.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });

  g.__jtmClient = createClient({
    url: `file:${file.replace(/\\/g, "/")}`,
  });
  return g.__jtmClient;
}

async function seed(client: Client): Promise<void> {
  const settingStatements = Object.entries(DEFAULT_SETTINGS).map(
    ([key, value]) => ({
      sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
      args: [key, value],
    }),
  );
  if (settingStatements.length) {
    await client.batch(settingStatements, "write");
  }

  if (MEMBER_RENAMES.length) {
    await client.batch(
      MEMBER_RENAMES.map(({ team, from, to }) => ({
        sql: "UPDATE member_catalog SET nickname = ? WHERE team = ? AND nickname = ?",
        args: [to, team, from],
      })),
      "write",
    );
  }

  // Sinkronkan roster member dari kode ke tabel member_catalog.
  // INSERT OR IGNORE: member baru dari kode ikut masuk, tetapi harga yang
  // sudah diedit lewat /admin/katalog TIDAK ditimpa.
  let memberSort = 0;
  const memberStatements: Array<{ sql: string; args: Array<string | number> }> =
    [];
  for (const group of MEMBER_TEAMS) {
    for (const member of group.members) {
      memberStatements.push({
        sql: "INSERT OR IGNORE INTO member_catalog (team, nickname, full_name, price_2s, mng_low, mng_high, sort) VALUES (?, ?, ?, ?, ?, ?, ?)",
        args: [
          group.team,
          member.nickname,
          member.fullName,
          member.price2s,
          member.mngLow,
          member.mngHigh,
          memberSort++,
        ],
      });
    }
  }
  if (memberStatements.length) {
    await client.batch(memberStatements, "write");
  }

  const countsResult = await client.execute(
    "SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM events) AS events",
  );
  const userCount = Number(countsResult.rows[0]?.users ?? 0);
  const eventCount = Number(countsResult.rows[0]?.events ?? 0);

  if (userCount === 0) {
    const email = process.env.ADMIN_EMAIL || "admin@jokitamas.local";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const name = process.env.ADMIN_NAME || "Admin Joki Ta Mas?";
    await client.execute({
      sql: "INSERT INTO users (name, email, password_hash, role, active, created_at) VALUES (?, ?, ?, 'admin', 1, ?)",
      args: [name, email, hashPassword(password), now()],
    });
  }

  if (eventCount === 0) {
    const eventResult = await client.execute({
      sql: "INSERT INTO events (name, venue, show_at, is_active, max_tickets, created_at) VALUES (?, ?, ?, 1, 4, ?)",
      args: [
        "AYO SENYUMLAH | JKT48 15th Anniversary Concert",
        "Surabaya",
        "2026-12-19T18:30:00+07:00",
        now(),
      ],
    });
    const eventId = Number(eventResult.lastInsertRowid);

    const sections: Array<[string, number, number]> = [
      ["CAT 1", 400000, 0],
      ["CAT 2", 350000, 1],
      ["CAT 3", 320000, 1],
      ["CAT 4", 300000, 1],
      ["CAT 5", 250000, 1],
      ["CAT 6", 220000, 1],
      ["CAT 7", 200000, 1],
    ];

    await client.batch(
      sections.map(([code, price, isOpen], index) => ({
        sql: "INSERT INTO sections (event_id, code, price, is_open, sort) VALUES (?, ?, ?, ?, ?)",
        args: [eventId, code, price, isOpen, index],
      })),
      "write",
    );
  }
}

async function init(): Promise<void> {
  const client = getClient();
  await client.executeMultiple(SCHEMA);
  await seed(client);
}

export async function getDb(): Promise<Client> {
  const g = globalThis as GlobalDb;
  if (!g.__jtmInit) {
    g.__jtmInit = init().catch((error) => {
      g.__jtmInit = undefined;
      throw error;
    });
  }
  await g.__jtmInit;
  return getClient();
}
