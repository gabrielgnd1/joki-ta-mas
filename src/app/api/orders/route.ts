import { NextRequest, NextResponse } from "next/server";
import { createOrder, OrderError } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { orderInputSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const settings = await getSettings();
  if (settings.orders_open !== "1") {
    return NextResponse.json(
      { ok: false, error: "Pemesanan sedang ditutup." },
      { status: 403 },
    );
  }

  const ip = clientIp(request.headers);
  const limit = rateLimit(`order:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Terlalu banyak percobaan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Format permintaan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = orderInputSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      {
        ok: false,
        error: first
          ? `${first.path.join(".") || "Data"}: ${first.message}`
          : "Data pesanan tidak valid.",
      },
      { status: 400 },
    );
  }

  if (parsed.data.website) {
    return NextResponse.json(
      { ok: false, error: "Permintaan ditolak." },
      { status: 400 },
    );
  }

  const ticketTypeOpen =
    parsed.data.ticketType === "Presale OFC"
      ? settings.ticket_ofc_enabled !== "0"
      : settings.ticket_general_enabled !== "0";

  if (!ticketTypeOpen) {
    return NextResponse.json(
      {
        ok: false,
        error: `Tipe penjualan ${parsed.data.ticketType} sedang ditutup.`,
      },
      { status: 403 },
    );
  }

  try {
    const { code, total } = await createOrder(parsed.data);
    return NextResponse.json({ ok: true, code, total }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 },
      );
    }
    console.error("createOrder failed", error);
    return NextResponse.json(
      { ok: false, error: "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}
