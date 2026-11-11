import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { randomToken, sha256 } from "./password";
import type { UserRow } from "./types";

export const SESSION_COOKIE = "jtm_session";
const SESSION_DAYS = 7;

export async function createSession(userId: number): Promise<void> {
  const db = await getDb();
  const token = randomToken(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const createdAt = new Date().toISOString();

  await db.execute({
    sql: "DELETE FROM sessions WHERE expires_at < ?",
    args: [createdAt],
  });
  await db.execute({
    sql: "INSERT INTO sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)",
    args: [userId, sha256(token), expires.toISOString(), createdAt],
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires,
  });
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.execute({
      sql: "DELETE FROM sessions WHERE token_hash = ?",
      args: [sha256(token)],
    });
  }
  store.delete(SESSION_COOKIE);
}

/**
 * Cached per request so the admin layout and page share a single session
 * lookup instead of hitting the database twice on every navigation.
 */
export const getCurrentUser = cache(async (): Promise<UserRow | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`,
    args: [sha256(token), new Date().toISOString()],
  });

  return (result.rows[0] as unknown as UserRow) ?? null;
});

export async function requireUser(): Promise<UserRow> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requireAdmin(): Promise<UserRow> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/admin");
  return user;
}
