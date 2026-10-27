/**
 * Копия базы SQLite на ходу (online backup API — согласованная копия даже при работающем сайте и WAL).
 *
 *   node scripts/db-backup.mjs [файл]          — по умолчанию <папка базы>/backups/app-<дата>.db
 *   node scripts/db-backup.mjs --keep 14       — после копии оставить 14 последних файлов в backups/
 *
 * База — DATABASE_PATH или data/app.db. В контейнере: docker compose exec web node scripts/db-backup.mjs
 * На Railway (перенос): railway ssh, затем DATABASE_PATH=/data/app.db node scripts/db-backup.mjs /data/export.db
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const keepAt = args.indexOf("--keep");
const keep = keepAt >= 0 ? Number(args.splice(keepAt, 2)[1]) : 0;

const src = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
if (!fs.existsSync(src)) {
  console.error(`No database at ${src}`);
  process.exit(1);
}
const dir = path.join(path.dirname(src), "backups");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const out = args[0] ?? path.join(dir, `app-${stamp}.db`);
fs.mkdirSync(path.dirname(out), { recursive: true });

const db = new Database(src, { readonly: true, fileMustExist: true });
await db.backup(out);
db.close();
console.log(`${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);

if (keep > 0 && !args[0]) {
  const old = fs.readdirSync(dir).filter((f) => /^app-.*\.db$/.test(f)).sort().slice(0, -keep);
  for (const f of old) fs.rmSync(path.join(dir, f));
  if (old.length) console.log(`removed ${old.length} old backup(s)`);
}
