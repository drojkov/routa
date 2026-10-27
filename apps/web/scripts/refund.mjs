#!/usr/bin/env node
/**
 * Заявки на возврат неиспользованного баланса (Refund Policy §2).
 *
 *   node scripts/refund.mjs list                    # заявки в работе
 *   node scripts/refund.mjs approve <request-id>    # после возврата денег у провайдера оплаты
 *   node scripts/refund.mjs reject <request-id>     # отклонить: замороженная сумма вернётся на баланс
 *
 * База — DATABASE_PATH или data/app.db (на Railway: `railway ssh`, DATABASE_PATH=/data/app.db).
 * Сумма заморожена ещё при создании заявки (проводка refund, ref `refund:<id>`), поэтому approve только
 * меняет статус, а reject добавляет обратную проводку adjust (ref `refund-release:<id>`).
 * Письмо клиенту об итоге пока отправляется вручную.
 */
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import path from "node:path";

const [cmd, id] = process.argv.slice(2);
const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
const db = new Database(file, { fileMustExist: true });
const usd = (m) => (m / 1_000_000).toFixed(2);

if (cmd === "list") {
  const rows = db
    .prepare(
      `select r.id, r.amount_micros, r.created_at, r.reason, u.email from refund_request r join user u on u.id = r.user_id
        where r.status = 'pending' order by r.created_at`,
    )
    .all();
  if (!rows.length) console.log("No pending refund requests.");
  for (const r of rows) console.log(`${r.id}  USD ${usd(r.amount_micros)}  ${new Date(r.created_at).toISOString()}  ${r.email}  ${r.reason ?? ""}`);
  process.exit(0);
}

if ((cmd !== "approve" && cmd !== "reject") || !id) {
  console.error("Usage: node scripts/refund.mjs list | approve <id> | reject <id>");
  process.exit(1);
}

const run = db.transaction(() => {
  const r = db.prepare("select * from refund_request where id = ?").get(id);
  if (!r) throw new Error(`Refund request ${id} not found`);
  if (r.status !== "pending") throw new Error(`Refund request is already ${r.status}`);
  const now = Date.now();
  db.prepare("update refund_request set status = ?, updated_at = ? where id = ?").run(cmd === "approve" ? "approved" : "rejected", now, id);
  if (cmd === "approve") {
    db.prepare("update ledger set note = 'Refunded to original payment method' where ref = ?").run(`refund:${id}`);
  } else {
    db.prepare("insert into ledger (id, user_id, kind, amount_micros, ref, note, created_at) values (?, ?, 'adjust', ?, ?, 'Refund request declined — hold released', ?)").run(
      randomUUID(),
      r.user_id,
      r.amount_micros,
      `refund-release:${id}`,
      now,
    );
  }
  return r;
});

try {
  const r = run();
  console.log(`${cmd === "approve" ? "Approved" : "Rejected"}: ${id}, USD ${usd(r.amount_micros)}`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
