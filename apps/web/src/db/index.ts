import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

/**
 * SQLite для разработки (SPEC §3 — Postgres в проде; схема переносится на drizzle-orm/pg-core).
 * Миграции применяются при первом обращении, поэтому свежий клон заводится без ручных шагов.
 */
function open() {
  // `next build` импортирует модуль из десятков воркеров разом: общий файл — гонка миграций
  // («table already exists»). Сборке настоящие данные не нужны — каждому воркеру своя база в памяти.
  const building = process.env.NEXT_PHASE === "phase-production-build";
  const file = building ? ":memory:" : (process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db"));
  if (!building) fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

// В dev модуль перезагружается при правках — держим одно соединение на процесс.
const g = globalThis as unknown as { __db?: ReturnType<typeof open> };
export const db = g.__db ?? (g.__db = open());
export { schema };
