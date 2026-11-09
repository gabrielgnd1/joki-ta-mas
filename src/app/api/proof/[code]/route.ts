import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getUploadsDir } from "@/lib/db";
import { getOrderByCode } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const order = getOrderByCode(code);
  if (!order || !order.proof_file) {
    return new NextResponse("Not found", { status: 404 });
  }

  const safeName = path.basename(order.proof_file);
  const filePath = path.join(getUploadsDir(), safeName);
  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(safeName).replace(".", "").toLowerCase();
  const buffer = fs.readFileSync(filePath);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Disposition": `inline; filename="bukti-${safeName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
