import { cache } from "react";
import { DEFAULT_SETTINGS, getDb } from "./db";

export type Settings = Record<string, string>;

/**
 * Cached per request so the admin layout and page don't fetch the same
 * settings twice from the remote database.
 */
export const getSettings = cache(async (): Promise<Settings> => {
  const db = await getDb();
  const result = await db.execute("SELECT key, value FROM settings");
  const settings: Settings = { ...DEFAULT_SETTINGS };
  for (const row of result.rows) {
    settings[String(row.key)] = String(row.value ?? "");
  }
  return settings;
});

export async function getSetting(key: string): Promise<string> {
  return (await getSettings())[key] ?? "";
}

export async function saveSettings(
  values: Record<string, string>,
): Promise<void> {
  const db = await getDb();
  const statements = Object.entries(values)
    .filter(([key]) => key in DEFAULT_SETTINGS)
    .map(([key, value]) => ({
      sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      args: [key, value],
    }));

  if (statements.length) await db.batch(statements, "write");
}
