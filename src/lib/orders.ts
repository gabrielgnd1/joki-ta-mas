import { getDb } from "./db";
import { generateOrderCode } from "./password";
import type { EventRow, OrderRow, SectionRow } from "./types";
import type { OrderInput } from "./validation";
import type { ResultSet } from "@libsql/client";

export class OrderError extends Error {}

function rows<T>(result: ResultSet): T[] {
  return result.rows as unknown as T[];
}

function first<T>(result: ResultSet): T | null {
  return (result.rows[0] as unknown as T) ?? null;
}

export async function getActiveEvent(): Promise<EventRow | null> {
  const db = await getDb();
  return first<EventRow>(
    await db.execute(
      "SELECT * FROM events WHERE is_active = 1 ORDER BY id DESC LIMIT 1",
    ),
  );
}

export async function getEventById(id: number): Promise<EventRow | null> {
  const db = await getDb();
  return first<EventRow>(
    await db.execute({ sql: "SELECT * FROM events WHERE id = ?", args: [id] }),
  );
}

export async function getSections(eventId: number): Promise<SectionRow[]> {
  const db = await getDb();
  return rows<SectionRow>(
    await db.execute({
      sql: "SELECT * FROM sections WHERE event_id = ? ORDER BY sort, id",
      args: [eventId],
    }),
  );
}

export async function getOrderByCode(code: string): Promise<OrderRow | null> {
  const db = await getDb();
  return first<OrderRow>(
    await db.execute({
      sql: "SELECT * FROM orders WHERE UPPER(code) = UPPER(?)",
      args: [code.trim()],
    }),
  );
}

export async function getOrderById(id: number): Promise<OrderRow | null> {
  const db = await getDb();
  return first<OrderRow>(
    await db.execute({ sql: "SELECT * FROM orders WHERE id = ?", args: [id] }),
  );
}

export async function listOrders(options: {
  q?: string;
  status?: string;
  limit?: number;
}): Promise<OrderRow[]> {
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (options.q) {
    where.push(
      "(code LIKE ? OR full_name LIKE ? OR whatsapp LIKE ? OR email LIKE ?)",
    );
    const term = `%${options.q}%`;
    params.push(term, term, term, term);
  }
  if (options.status && options.status !== "all") {
    where.push("status = ?");
    params.push(options.status);
  }

  const sql = `SELECT * FROM orders ${
    where.length ? `WHERE ${where.join(" AND ")}` : ""
  } ORDER BY created_at DESC LIMIT ?`;
  params.push(options.limit ?? 200);

  const db = await getDb();
  return rows<OrderRow>(await db.execute({ sql, args: params }));
}

export async function getStats(): Promise<{
  total: number;
  pending: number;
  review: number;
  verified: number;
  completed: number;
  cancelled: number;
  revenue: number;
}> {
  const db = await getDb();
  const result = await db.execute(
    "SELECT status, COUNT(*) AS c, COALESCE(SUM(total), 0) AS sum FROM orders GROUP BY status",
  );

  const stats = {
    total: 0,
    pending: 0,
    review: 0,
    verified: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
  };

  for (const row of result.rows) {
    const count = Number(row.c ?? 0);
    const status = String(row.status);
    stats.total += count;
    if (status in stats) {
      stats[status as keyof typeof stats] += count;
    }
    if (status === "verified" || status === "completed") {
      stats.revenue += Number(row.sum ?? 0);
    }
  }
  return stats;
}

export async function createOrder(
  input: OrderInput,
): Promise<{ code: string; total: number }> {
  const db = await getDb();
  const event = await getEventById(input.eventId);
  if (!event || !event.is_active) {
    throw new OrderError("Event tidak tersedia atau sudah ditutup.");
  }

  const sections = await getSections(event.id);
  const section = sections.find((s) => s.code === input.sectionCode);
  if (!section) throw new OrderError("Section tidak ditemukan.");
  if (!section.is_open) throw new OrderError("Section tersebut sudah ditutup.");

  if (input.qty > event.max_tickets) {
    throw new OrderError(`Maksimal ${event.max_tickets} tiket per pesanan.`);
  }

  const validCodes = new Set(sections.map((s) => s.code));
  const backups = input.backupSections
    .filter((code) => validCodes.has(code) && code !== section.code)
    .slice(0, 10);

  const total = section.price * input.qty;
  const now = new Date().toISOString();

  const sql = `INSERT INTO orders (
    code, event_id, event_name, show_at, ticket_type, section_code,
    section_price, qty, total, backup_sections, full_name, x_username,
    email, whatsapp, nik, gender, birth_date, payment_method, note,
    status, created_at, updated_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?,
    'pending', ?, ?
  )`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateOrderCode();
    try {
      await db.execute({
        sql,
        args: [
          code,
          event.id,
          event.name,
          event.show_at,
          input.ticketType,
          section.code,
          section.price,
          input.qty,
          total,
          JSON.stringify(backups),
          input.fullName,
          input.xUsername,
          input.email,
          input.whatsapp,
          input.nik,
          input.gender,
          input.birthDate,
          input.paymentMethod,
          input.note ?? "",
          now,
          now,
        ],
      });
      return { code, total };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("UNIQUE") || attempt === 4) throw error;
    }
  }

  throw new OrderError("Gagal membuat kode pesanan, silakan coba lagi.");
}
