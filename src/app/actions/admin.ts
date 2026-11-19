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
      sql: "UPDATE service_orders SET status = ?, verified_by = ?, verified_at = ?, updated_at = ? WHERE id = ?",
      args: [status, user.name, now, now, id],
    });
  } else {
    await db.execute({
      sql: "UPDATE service_orders SET status = ?, updated_at = ? WHERE id = ?",
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
    sql: "UPDATE service_orders SET internal_note = ?, updated_at = ? WHERE id = ?",
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
    "announcement",
  ];

  const values: Record<string, string> = {};
  for (const key of keys) {
    values[key] = String(formData.get(key) || "").trim();
  }
  values.orders_open = formData.get("orders_open") ? "1" : "0";
  values.ticket_ofc_enabled = formData.get("ticket_ofc_enabled") ? "1" : "0";
  values.ticket_general_enabled = formData.get("ticket_general_enabled")
    ? "1"
    : "0";

  await saveSettings(values);

  revalidatePath("/admin/settings");
  revalidatePath("/");
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
