import { getDb } from "./db";
import { generateOrderCode } from "./password";
import type { EventRow, OrderRow, SectionRow } from "./types";
import type { OrderInput } from "./validation";

export class OrderError extends Error {}

export function getActiveEvent(): EventRow | null {
  return (
    (getDb()
      .prepare("SELECT * FROM events WHERE is_active = 1 ORDER BY id DESC LIMIT 1")
      .get() as EventRow | undefined) ?? null
  );
}

export function getEventById(id: number): EventRow | null {
  return (
    (getDb().prepare("SELECT * FROM events WHERE id = ?").get(id) as
      | EventRow
      | undefined) ?? null
  );
}

export function getSections(eventId: number): SectionRow[] {
  return getDb()
    .prepare("SELECT * FROM sections WHERE event_id = ? ORDER BY sort, id")
    .all(eventId) as SectionRow[];
}

export function getOrderByCode(code: string): OrderRow | null {
  return (
    (getDb()
      .prepare("SELECT * FROM orders WHERE UPPER(code) = UPPER(?)")
      .get(code.trim()) as OrderRow | undefined) ?? null
  );
}

export function getOrderById(id: number): OrderRow | null {
  return (
    (getDb().prepare("SELECT * FROM orders WHERE id = ?").get(id) as
      | OrderRow
      | undefined) ?? null
  );
}

export function listOrders(options: {
  q?: string;
  status?: string;
  limit?: number;
}): OrderRow[] {
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

  return getDb().prepare(sql).all(...params) as OrderRow[];
}

export function getStats(): {
  total: number;
  pending: number;
  review: number;
  verified: number;
  completed: number;
  cancelled: number;
  revenue: number;
} {
  const rows = getDb()
    .prepare("SELECT status, COUNT(*) AS c, COALESCE(SUM(total), 0) AS sum FROM orders GROUP BY status")
    .all() as Array<{ status: string; c: number; sum: number }>;

  const stats = {
    total: 0,
    pending: 0,
    review: 0,
    verified: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
  };

  for (const row of rows) {
    stats.total += row.c;
    if (row.status in stats) {
      stats[row.status as keyof typeof stats] += row.c;
    }
    if (row.status === "verified" || row.status === "completed") {
      stats.revenue += row.sum;
    }
  }
  return stats;
}

export function createOrder(input: OrderInput): { code: string; total: number } {
  const db = getDb();
  const event = getEventById(input.eventId);
  if (!event || !event.is_active) {
    throw new OrderError("Event tidak tersedia atau sudah ditutup.");
  }

  const sections = getSections(event.id);
  const section = sections.find((s) => s.code === input.sectionCode);
  if (!section) throw new OrderError("Section tidak ditemukan.");
  if (!section.is_open) throw new OrderError("Section tersebut sudah ditutup.");

  if (input.qty > event.max_tickets) {
    throw new OrderError(
      `Maksimal ${event.max_tickets} tiket per pesanan.`,
    );
  }

  const validCodes = new Set(sections.map((s) => s.code));
  const backups = input.backupSections
    .filter((code) => validCodes.has(code) && code !== section.code)
    .slice(0, 10);

  const total = section.price * input.qty;
  const now = new Date().toISOString();

  const insert = db.prepare(
    `INSERT INTO orders (
      code, event_id, event_name, show_at, ticket_type, section_code,
      section_price, qty, total, backup_sections, full_name, x_username,
      email, whatsapp, nik, gender, birth_date, payment_method, note,
      status, created_at, updated_at
    ) VALUES (
      @code, @event_id, @event_name, @show_at, @ticket_type, @section_code,
      @section_price, @qty, @total, @backup_sections, @full_name, @x_username,
      @email, @whatsapp, @nik, @gender, @birth_date, @payment_method, @note,
      'pending', @created_at, @created_at
    )`,
  );

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateOrderCode();
    try {
      insert.run({
        code,
        event_id: event.id,
        event_name: event.name,
        show_at: event.show_at,
        ticket_type: input.ticketType,
        section_code: section.code,
        section_price: section.price,
        qty: input.qty,
        total,
        backup_sections: JSON.stringify(backups),
        full_name: input.fullName,
        x_username: input.xUsername,
        email: input.email,
        whatsapp: input.whatsapp,
        nik: input.nik,
        gender: input.gender,
        birth_date: input.birthDate,
        payment_method: input.paymentMethod,
        note: input.note ?? "",
        created_at: now,
      });
      return { code, total };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("UNIQUE") || attempt === 4) throw error;
    }
  }

  throw new OrderError("Gagal membuat kode pesanan, silakan coba lagi.");
}
