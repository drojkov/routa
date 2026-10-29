#!/usr/bin/env node
/**
 * Заявки на возврат неиспользованного баланса (Refund Policy §2).
 *
 *   npm run refund list                             # заявки в работе, со сроками из Refund Policy §2
 *   npm run refund create <email> [reason]          # заявка по письму или форме: сумма замораживается сразу
 *   npm run refund approve <request-id>             # после возврата денег у провайдера оплаты
 *   npm run refund reject <request-id>              # отклонить: замороженная сумма вернётся на баланс
 *
 * Сроки (Refund Policy §2): рассмотреть за 3 рабочих дня, отправить деньги за 10 рабочих дней после одобрения.
 *
 * База — DATABASE_PATH или data/app.db (на сервере: docker compose exec web npm run refund …).
 * Сумма заморожена ещё при создании заявки (проводка refund, ref `refund:<id>`), поэтому approve только
 * меняет статус, а reject добавляет обратную проводку adjust (ref `refund-release:<id>`).
 * Письмо клиенту об итоге пока отправляется вручную.
 */
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import path from "node:path";

const [cmd, id, ...rest] = process.argv.slice(2);
const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
const db = new Database(file, { fileMustExist: true });
db.pragma("foreign_keys = ON");
const usd = (m) => (m / 1_000_000).toFixed(2);
/** Дата + n рабочих дней (пн–пт). */
function addBusinessDays(ms, n) {
  const d = new Date(ms);
  while (n > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) n--;
  }
  return d;
}
/** Как lib/account-close.ts anonymizeIfSettled: закрытый аккаунт без заявок в работе — обезличить. */
function anonymizeIfSettled(userId) {
  const u = db.prepare("select closed_at from user where id = ?").get(userId);
  if (!u?.closed_at) return false;
  if (db.prepare("select 1 from refund_request where user_id = ? and status = 'pending'").get(userId)) return false;
  db.prepare("update user set email = ?, name = 'Closed account', image = null, email_verified = 0 where id = ?").run(`closed-${userId}@closed.invalid`, userId);
  return true;
}
/** Как refundableMicrosTx в lib/refunds.ts. */
function refundable(userId) {
  const sum = (sql) => Number(db.prepare(sql).get(userId)?.v ?? 0);
  const balance = sum("select coalesce(sum(amount_micros),0) v from ledger where user_id = ?");
  const paid = sum("select coalesce(sum(amount_micros),0) v from ledger where user_id = ? and kind = 'topup'");
  const refunded = sum("select coalesce(sum(amount_micros),0) v from ledger where user_id = ? and kind = 'refund'");
  const back = sum("select coalesce(sum(amount_micros),0) v from ledger where user_id = ? and kind = 'adjust' and (ref like 'refund-release:%' or ref like 'correction:%')");
  return Math.max(0, Math.min(balance, paid + refunded + back));
}

if (cmd === "create") {
  const u = db.prepare("select * from user where lower(email) = lower(?)").get(id ?? "");
  if (!u) {
    console.error(`No user with email ${id}`);
    process.exit(1);
  }
  const res = db.transaction(() => {
    if (db.prepare("select 1 from refund_request where user_id = ? and status = 'pending'").get(u.id)) return { error: "A refund request is already pending." };
    const amount = refundable(u.id);
    if (amount < 10_000) return { error: "Nothing to refund: no unused paid balance." };
    const rid = randomUUID();
    const now = Date.now();
    db.prepare("insert into refund_request (id, user_id, amount_micros, status, reason, created_at, updated_at) values (?, ?, ?, 'pending', ?, ?, ?)").run(
      rid,
      u.id,
      amount,
      rest.join(" ") || "Requested by email",
      now,
      now,
    );
    db.prepare("insert into ledger (id, user_id, kind, amount_micros, ref, note, created_at) values (?, ?, 'refund', ?, ?, 'Refund requested', ?)").run(randomUUID(), u.id, -amount, `refund:${rid}`, now);
    return { rid, amount };
  })();
  if (res.error) {
    console.error(res.error);
    process.exit(1);
  }
  console.log(`Created ${res.rid}: USD ${usd(res.amount)} held for ${u.email}. Confirm receipt to the customer by email (Refund Policy §2).`);
  process.exit(0);
}

if (cmd === "list") {
  const rows = db
    .prepare(
      `select r.id, r.amount_micros, r.created_at, r.reason, u.email from refund_request r join user u on u.id = r.user_id
        where r.status = 'pending' order by r.created_at`,
    )
    .all();
  if (!rows.length) console.log("No pending refund requests.");
  for (const r of rows) {
    const due = addBusinessDays(r.created_at, 3);
    const late = due.getTime() < Date.now() ? "  OVERDUE" : "";
    console.log(`${r.id}  USD ${usd(r.amount_micros)}  ${new Date(r.created_at).toISOString().slice(0, 10)}  review by ${due.toISOString().slice(0, 10)}${late}  ${r.email}  ${r.reason ?? ""}`);
  }
  process.exit(0);
}

if ((cmd !== "approve" && cmd !== "reject") || !id) {
  console.error("Usage: npm run refund list | create <email> [reason] | approve <id> | reject <id>");
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
  if (cmd === "approve") console.log(`Send the refund by ${addBusinessDays(Date.now(), 10).toISOString().slice(0, 10)} (10 business days, Refund Policy §2).`);
  if (anonymizeIfSettled(r.user_id)) console.log("Closed account — personal details anonymised.");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
