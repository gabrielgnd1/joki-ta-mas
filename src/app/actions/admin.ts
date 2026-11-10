"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { saveSettings } from "@/lib/settings";
import type { OrderStatus, Role } from "@/lib/types";

const ALLOWED_STATUS: OrderStatus[] = [
  "pending",
  "review",
  "verified",
  "completed",
  "cancelled",
];

export async function updateOrderStatusAction(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;

  if (!Number.isInteger(id) || id <= 0) return;
  if (!ALLOWED_STATUS.includes(status)) return;

  const db = await getDb();
  const now = new Date().toISOString();

  if (status === "verified") {
    await db.execute({
      sql: "UPDATE orders SET status = ?, verified_by = ?, verified_at = ?, updated_at = ? WHERE id = ?",
      args: [status, user.name, now, now, id],
    });
  } else {
    await db.execute({
      sql: "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?",
      args: [status, now, id],
    });
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${id}`);
}

export async function saveOrderNoteAction(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  const note = String(formData.get("internal_note") || "")
    .trim()
    .slice(0, 2000);

  if (!Number.isInteger(id) || id <= 0) return;

  const db = await getDb();
  await db.execute({
    sql: "UPDATE orders SET internal_note = ?, updated_at = ? WHERE id = ?",
    args: [note, new Date().toISOString(), id],
  });

  revalidatePath(`/admin/orders/${id}`);
}

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();

  const keys = [
    "site_name",
    "site_tagline",
    "wa_number",
    "wa_number_2",
    "x_username",
    "qris_merchant",
    "qris_nmid",
    "qris_image",
    "qris_note",
    "payment_note",
    "terms",
    "announcement",
  ];

  const values: Record<string, string> = {};
  for (const key of keys) {
    values[key] = String(formData.get(key) || "").trim();
  }
  values.orders_open = formData.get("orders_open") ? "1" : "0";

  await saveSettings(values);

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/pricelist");
}

function toJakartaIso(value: string): string | null {
  if (!value) return null;
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(value)) return value;
  return `${value.length === 16 ? `${value}:00` : value}+07:00`;
}

export async function saveEventAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const venue = String(formData.get("venue") || "").trim();
  const showAt = String(formData.get("show_at") || "").trim();
  const maxTickets = Math.min(
    10,
    Math.max(1, Number(formData.get("max_tickets")) || 4),
  );
  const isActive = formData.get("is_active") ? 1 : 0;

  if (!Number.isInteger(id) || id <= 0 || !name) return;

  const db = await getDb();
  await db.execute({
    sql: "UPDATE events SET name = ?, venue = ?, show_at = ?, max_tickets = ?, is_active = ? WHERE id = ?",
    args: [name, venue || null, toJakartaIso(showAt), maxTickets, isActive, id],
  });

  revalidatePath("/admin/event");
  revalidatePath("/");
  revalidatePath("/pricelist");
}

export async function saveSectionAction(formData: FormData) {
  await requireAdmin();

  const id = Number(formData.get("id"));
  const price = Math.max(0, Number(formData.get("price")) || 0);
  const isOpen = formData.get("is_open") ? 1 : 0;

  if (!Number.isInteger(id) || id <= 0) return;

  const db = await getDb();
  await db.execute({
    sql: "UPDATE sections SET price = ?, is_open = ? WHERE id = ?",
    args: [price, isOpen, id],
  });

  revalidatePath("/admin/event");
  revalidatePath("/");
  revalidatePath("/pricelist");
}

export async function addUserAction(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "verifier") as Role;

  if (!name || !email || password.length < 8) {
    redirect("/admin/team?error=invalid");
  }
  if (role !== "admin" && role !== "verifier") {
    redirect("/admin/team?error=invalid");
  }

  try {
    const db = await getDb();
    await db.execute({
      sql: "INSERT INTO users (name, email, password_hash, role, active, created_at) VALUES (?, ?, ?, ?, 1, ?)",
      args: [name, email, hashPassword(password), role, new Date().toISOString()],
    });
  } catch {
    redirect("/admin/team?error=exists");
  }

  revalidatePath("/admin/team");
}

export async function toggleUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const active = Number(formData.get("active")) === 1 ? 0 : 1;

  if (!Number.isInteger(id) || id <= 0) return;
  if (id === admin.id) redirect("/admin/team?error=self");

  const db = await getDb();
  await db.execute({
    sql: "UPDATE users SET active = ? WHERE id = ?",
    args: [active, id],
  });
  revalidatePath("/admin/team");
}

export async function resetPasswordAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const password = String(formData.get("password") || "");

  if (!Number.isInteger(id) || id <= 0 || password.length < 8) {
    redirect("/admin/team?error=password");
  }
  if (id === admin.id) {
    // allow changing own password
  }

  const db = await getDb();
  await db.execute({
    sql: "UPDATE users SET password_hash = ? WHERE id = ?",
    args: [hashPassword(password), id],
  });

  await db.execute({
    sql: "DELETE FROM sessions WHERE user_id = ?",
    args: [id],
  });
  revalidatePath("/admin/team");
}
