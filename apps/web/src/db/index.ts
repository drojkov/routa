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
  // Удалённое затирается в файле, а не остаётся в свободных страницах (и в бэкапах) — Privacy §7.
  sqlite.pragma("secure_delete = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  if (!building) scheduleMaintenance(sqlite, file);
  return db;
}

/** Тексты запросов храним 30 дней (Privacy §7; CONTENT_RETENTION_DAYS в lib/request-content.ts). */
const CONTENT_RETENTION_MS = 30 * 86_400_000;
/**
 * Неоплаченный заказ закрывается через сутки (Terms §5.3 — лимит открытых заказов, ORDER_LIMITS).
 * Счета для компаний (method = 'invoice') не закрываются: банковский перевод идёт дольше суток.
 */
export const ORDER_TTL_MS = 24 * 3_600_000;
/** Privacy §7: 24 месяца — журнал входов, сообщения из формы, IP/страна/браузер в заказах, журнале запросов и заявках на возврат. */
const LOG_RETENTION_MS = 730 * 86_400_000;

/**
 * Плановая чистка: при открытии базы и затем раз в час. Работает в процессе сервера, без внешнего cron.
 * Заказ, оплаченный после закрытия, всё равно зачислится — creditPayment принимает и закрытые по сроку.
 */
function scheduleMaintenance(sqlite: Database.Database, file: string) {
  const run = () => {
    void dailyBackup(sqlite, file);
    try {
      const now = Date.now();
      sqlite.prepare("delete from request_content where created_at < ?").run(now - CONTENT_RETENTION_MS);
      sqlite.prepare("update payment set status = 'canceled', updated_at = ? where status = 'pending' and method != 'invoice' and created_at < ?").run(now, now - ORDER_TTL_MS);
      // Privacy §7: 24 месяца. Сами заказы, проводки и request_log остаются (бухгалтерия — 7 лет).
      const logCutoff = now - LOG_RETENTION_MS;
      sqlite.prepare("delete from login_event where created_at < ?").run(logCutoff);
      sqlite.prepare("delete from contact_message where created_at < ?").run(logCutoff);
      sqlite
        .prepare("update payment set ip_address = null, country = null, user_agent = null where created_at < ? and (ip_address is not null or country is not null or user_agent is not null)")
        .run(logCutoff);
      sqlite.prepare("update request_log set ip_address = null where created_at < ? and ip_address is not null").run(logCutoff);
      sqlite.prepare("update refund_request set ip_address = null where created_at < ? and ip_address is not null").run(logCutoff);
      // Протухшие сессии (IP и браузер) и токены подтверждения email — Privacy §7, «пока аккаунт открыт» не значит «вечно».
      sqlite.prepare("delete from session where expires_at < ?").run(now);
      sqlite.prepare("delete from verification where expires_at < ?").run(now);
    } catch (e) {
      console.error("[db] maintenance failed", e);
    }
    // AUP §4: письмо в поддержку о необычном расходе и отказах (lib/monitoring.ts).
    import("@/lib/monitoring")
      .then((m) => m.checkUsageAnomalies(sqlite))
      .catch((e) => console.error("[monitoring] failed", e));
  };
  run();
  setInterval(run, 3_600_000).unref();
}

/** Privacy §7: бэкапы хранятся 14 дней. Копия раз в сутки — в production (или DB_BACKUP=on), DB_BACKUP=off — выключить. */
const BACKUP_KEEP = 14;
const BACKUP_EVERY_MS = 23 * 3_600_000;

async function dailyBackup(sqlite: Database.Database, file: string) {
  const on = process.env.DB_BACKUP ? process.env.DB_BACKUP === "on" : process.env.NODE_ENV === "production";
  if (!on) return;
  try {
    const dir = path.join(path.dirname(file), "backups");
    fs.mkdirSync(dir, { recursive: true });
    const files = fs.readdirSync(dir).filter((f) => /^app-.*\.db$/.test(f)).sort();
    const last = files.at(-1);
    if (last && Date.now() - fs.statSync(path.join(dir, last)).mtimeMs < BACKUP_EVERY_MS) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    await sqlite.backup(path.join(dir, `app-${stamp}.db`));
    for (const f of [...files, `app-${stamp}.db`].sort().slice(0, -BACKUP_KEEP)) fs.rmSync(path.join(dir, f), { force: true });
    console.log(`[db] backup app-${stamp}.db`);
  } catch (e) {
    console.error("[db] backup failed", e);
  }
}

// В dev модуль перезагружается при правках — держим одно соединение на процесс.
const g = globalThis as unknown as { __db?: ReturnType<typeof open> };
export const db = g.__db ?? (g.__db = open());
export { schema };
