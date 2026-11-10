"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession, destroyCurrentSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { UserRow } from "@/lib/types";
import { loginSchema } from "@/lib/validation";

export async function loginAction(formData: FormData): Promise<void> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/admin/login?error=invalid");
  }

  const headerList = await headers();
  const ip = clientIp(headerList);
  const limit = rateLimit(`login:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.ok) {
    redirect("/admin/login?error=ratelimit");
  }

  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT * FROM users WHERE email = ? AND active = 1",
    args: [parsed.data.email],
  });
  const user = result.rows[0] as unknown as UserRow | undefined;

  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    redirect("/admin/login?error=invalid");
  }

  await createSession(user.id);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession();
  redirect("/admin/login");
}
