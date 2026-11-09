import { DEFAULT_SETTINGS, getDb } from "./db";

export type Settings = Record<string, string>;

export function getSettings(): Settings {
  const rows = getDb()
    .prepare("SELECT key, value FROM settings")
    .all() as Array<{ key: string; value: string }>;

  const settings: Settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) settings[row.key] = row.value;
  return settings;
}

export function getSetting(key: string): string {
  return getSettings()[key] ?? "";
}

export function saveSettings(values: Record<string, string>): void {
  const db = getDb();
  const upsert = db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  const run = db.transaction(() => {
    for (const [key, value] of Object.entries(values)) {
      if (key in DEFAULT_SETTINGS) upsert.run(key, value);
    }
  });
  run();
}
