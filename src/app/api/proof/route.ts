import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { getDb, getUploadsDir } from "@/lib/db";
import { getOrderByCode } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 4 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`proof:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Terlalu banyak upload. Coba lagi nanti." },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Format upload tidak valid." },
      { status: 400 },
    );
  }

  const code = String(form.get("code") || "").trim();
  const file = form.get("file");

  if (!code) {
    return NextResponse.json(
      { ok: false, error: "Kode pesanan wajib diisi." },
      { status: 400 },
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "File bukti transfer wajib dipilih." },
      { status: 400 },
    );
  }
  if (file.size === 0 || file.size > MAX_SIZE) {
    return NextResponse.json(
      { ok: false, error: "Ukuran file maksimal 4 MB." },
      { status: 400 },
    );
  }

  const ext = ALLOWED[file.type];
  if (!ext) {
    return NextResponse.json(
      { ok: false, error: "Format harus JPG, PNG, WEBP, atau PDF." },
      { status: 400 },
    );
  }

  const order = getOrderByCode(code);
  if (!order) {
    return NextResponse.json(
      { ok: false, error: "Kode pesanan tidak ditemukan." },
      { status: 404 },
    );
  }
  if (order.status === "cancelled") {
    return NextResponse.json(
      { ok: false, error: "Pesanan ini sudah dibatalkan." },
      { status: 400 },
    );
  }

  const filename = `${order.id}-${Date.now()}-${crypto
    .randomBytes(4)
    .toString("hex")}.${ext}`;
  const target = path.join(getUploadsDir(), filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(target, buffer);

  const db = getDb();
  db.prepare(
    `UPDATE orders
     SET proof_file = ?, proof_uploaded_at = ?, updated_at = ?,
         status = CASE WHEN status = 'pending' THEN 'review' ELSE status END
     WHERE id = ?`,
  ).run(filename, new Date().toISOString(), new Date().toISOString(), order.id);

  return NextResponse.json({ ok: true });
}
