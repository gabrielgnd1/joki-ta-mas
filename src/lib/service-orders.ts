import { getDb } from "./db";
import { calculateItemCost, findMember } from "./members";
import { generateOrderCode } from "./password";
import type { OrderItem, ServiceOrderRow, ServiceType } from "./types";
import type { JokiOrderInput } from "./validation";
import type { ResultSet } from "@libsql/client";

export class OrderError extends Error {}

function rows<T>(result: ResultSet): T[] {
  return result.rows as unknown as T[];
}

function first<T>(result: ResultSet): T | null {
  return (result.rows[0] as unknown as T) ?? null;
}

export async function getServiceOrderById(
  id: number,
): Promise<ServiceOrderRow | null> {
  const db = await getDb();
  return first<ServiceOrderRow>(
    await db.execute({
      sql: "SELECT * FROM service_orders WHERE id = ?",
      args: [id],
    }),
  );
}

export async function listServiceOrders(options: {
  q?: string;
  status?: string;
  limit?: number;
}): Promise<ServiceOrderRow[]> {
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (options.q) {
    where.push(
      "(code LIKE ? OR customer_name LIKE ? OR jkt_email LIKE ? OR items LIKE ?)",
    );
    const term = `%${options.q}%`;
    params.push(term, term, term, term);
  }
  if (options.status && options.status !== "all") {
    where.push("status = ?");
    params.push(options.status);
  }

  const sql = `SELECT * FROM service_orders ${
    where.length ? `WHERE ${where.join(" AND ")}` : ""
  } ORDER BY created_at DESC LIMIT ?`;
  params.push(options.limit ?? 200);

  const db = await getDb();
  return rows<ServiceOrderRow>(await db.execute({ sql, args: params }));
}

export async function getServiceStats(): Promise<{
  total: number;
  pending: number;
  review: number;
  verified: number;
  completed: number;
  cancelled: number;
  revenue: number;
  tickets: number;
}> {
  const db = await getDb();
  const result = await db.execute(
    "SELECT status, COUNT(*) AS c, COALESCE(SUM(total), 0) AS sum, COALESCE(SUM(ticket_count), 0) AS tickets FROM service_orders GROUP BY status",
  );

  const stats = {
    total: 0,
    pending: 0,
    review: 0,
    verified: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
    tickets: 0,
  };

  for (const row of result.rows) {
    const count = Number(row.c ?? 0);
    const status = String(row.status);
    stats.total += count;
    stats.tickets += Number(row.tickets ?? 0);
    if (status in stats) {
      stats[status as keyof typeof stats] += count;
    }
    if (status === "verified" || status === "completed") {
      stats.revenue += Number(row.sum ?? 0);
    }
  }
  return stats;
}

/**
 * Simpan pesanan baru. Semua harga dihitung ulang di server dari katalog
 * member — data harga dari client diabaikan.
 */
export async function createServiceOrder(
  input: JokiOrderInput,
): Promise<{ code: string; total: number; itemCount: number; ticketCount: number }> {
  const items: OrderItem[] = [];
  let total = 0;
  let ticketCount = 0;

  for (const line of input.items) {
    const member = findMember(line.team, line.nickname);
    if (!member) {
      throw new OrderError(`Member "${line.nickname}" tidak ditemukan.`);
    }

    const is2s = line.serviceType === "2S";
    // 2S selalu 1 tiket; MnG dibatasi 1–20 tiket.
    const qty = is2s ? 1 : Math.min(20, Math.max(1, Math.trunc(line.qty)));
    if (!is2s && (line.qty < 1 || line.qty > 20)) {
      throw new OrderError("Jumlah tiket MnG harus antara 1–20.");
    }

    const { subtotal, detailText } = calculateItemCost(
      member,
      line.serviceType,
      qty,
    );

    items.push({
      serviceType: line.serviceType,
      team: line.team,
      nickname: member.nickname,
      fullName: member.fullName,
      qty,
      sessionNote: line.sessionNote,
      subtotal,
      priceLabel: detailText,
    });

    total += subtotal;
    ticketCount += qty;
  }

  if (items.length === 0) {
    throw new OrderError("Tambahkan minimal 1 member.");
  }

  const serviceTypes: ServiceType[] = (["2S", "MnG"] as ServiceType[]).filter(
    (type) => items.some((item) => item.serviceType === type),
  );

  const now = new Date().toISOString();
  const sql = `INSERT INTO service_orders (
    code, items, item_count, ticket_count, total, service_types,
    customer_name, account_type, jkt_email, jkt_password,
    status, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`;

  const db = await getDb();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateOrderCode();
    try {
      await db.execute({
        sql,
        args: [
          code,
          JSON.stringify(items),
          items.length,
          ticketCount,
          total,
          serviceTypes.join("+"),
          input.customerName,
          input.accountType,
          input.jktEmail,
          input.jktPassword,
          now,
          now,
        ],
      });
      return { code, total, itemCount: items.length, ticketCount };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("UNIQUE") || attempt === 4) throw error;
    }
  }

  throw new OrderError("Gagal membuat kode pesanan, silakan coba lagi.");
}
