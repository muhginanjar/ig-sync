import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

function open() {
  const file = process.env.DATABASE_PATH ?? "./data/app.db";
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("busy_timeout = 5000"); // web + cron processes share the file
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

// Opened lazily: `next build` imports route modules in parallel workers and
// must not touch the database. One connection is reused across dev reloads.
const g = globalThis as unknown as { __db?: ReturnType<typeof open> };
export function getDb() {
  return (g.__db ??= open());
}

/**
 * Applies pending migrations. Run from a single process only
 * (`npm run db:migrate` or the sync script), never from the web server.
 */
export function migrateDb() {
  const db = getDb();
  // Migrations that rebuild a table DROP it; with foreign keys on, that would
  // cascade-delete post_media. The PRAGMA must be set outside the migration
  // transaction to take effect.
  db.$client.pragma("foreign_keys = OFF");
  try {
    migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  } finally {
    db.$client.pragma("foreign_keys = ON");
  }
}

export * from "./schema";
