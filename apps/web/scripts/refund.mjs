#!/usr/bin/env node
/**
 * Заявки на возврат неиспользованного баланса (Refund Policy §2).
 *
 *   npm run refund list                                     # заявки в работе, со сроками из Refund Policy §2
 *   npm run refund -- create <email> [--usd <x>] [reason]   # заявка по письму или форме: сумма замораживается сразу;
 *                                                           #   без --usd — весь неиспользованный оплаченный баланс;
 *                                                           #   `--` после refund обязателен, иначе npm заберёт --usd себе
 *   npm run refund approve <request-id> [usd]               # после возврата денег у провайдера оплаты; с [usd] — частично:
 *                                                           #   одобряется эта сумма, остаток возвращается на баланс
 *   npm run refund reject <request-id> <reason>             # отклонить: сумма вернётся на баланс, причину клиент увидит в кабинете
 *
 * Сроки (Refund Policy §2): рассмотреть за 3 рабочих дня, отправить деньги за 10 рабочих дней после одобрения.
 *
 * База — DATABASE_PATH или data/app.db (на сервере: docker compose exec web npm run refund …).
 * Сумма заморожена ещё при создании заявки (проводка refund, ref `refund:<id>`), поэтому approve только
 * меняет статус (частичный — ещё и размораживает остаток), а reject добавляет обратную проводку adjust
 * (ref `refund-release:<id>`). Комментарий к решению (decision_note) клиент видит в списке заявок в кабинете.
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
  const u = db.prepare("select closed_at, email from user where id = ?").get(userId);
  if (!u?.closed_at) return false;
  if (db.prepare("select 1 from refund_request where user_id = ? and status = 'pending'").get(userId)) return false;
  const closed = `closed-${userId}@closed.invalid`;
  db.prepare("update contact_message set name = 'Closed account', email = ?, user_id = ? where user_id = ? or lower(email) = lower(?)").run(closed, userId, userId, u.email);
  db.prepare("update user set email = ?, name = 'Closed account', image = null, email_verified = 0 where id = ?").run(closed, userId);
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
  // Без `--` npm забирает флаг себе (`npm run refund create x --usd 5` → скрипт его не видит) — не создаём заявку на всю сумму молча.
  if (process.env.npm_config_usd !== undefined && !rest.includes("--usd")) {
    console.error("npm swallowed --usd. Run: npm run refund -- create <email> --usd <x> [reason]");
    process.exit(1);
  }
  const words = [...rest];
  let wanted = null;
  const flag = words.indexOf("--usd");
  if (flag !== -1) {
    const v = Number(words[flag + 1]);
    if (!(v > 0)) {
      console.error("--usd needs a positive amount, e.g. --usd 12.50");
      process.exit(1);
    }
    wanted = Math.round(v * 100) * 10_000;
    words.splice(flag, 2);
  }
  const res = db.transaction(() => {
    if (db.prepare("select 1 from refund_request where user_id = ? and status = 'pending'").get(u.id)) return { error: "A refund request is already pending." };
    const max = refundable(u.id);
    if (max < 10_000) return { error: "Nothing to refund: no unused paid balance." };
    if (wanted !== null && wanted > max) return { error: `Only USD ${usd(max)} of unused paid balance can be refunded.` };
    const amount = wanted ?? max;
    const rid = randomUUID();
    const now = Date.now();
    db.prepare("insert into refund_request (id, user_id, amount_micros, status, reason, created_at, updated_at) values (?, ?, ?, 'pending', ?, ?, ?)").run(
      rid,
      u.id,
      amount,
      words.join(" ") || "Requested by email",
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
      `select r.id, r.kind, r.amount_micros, r.created_at, r.reason, u.email from refund_request r join user u on u.id = r.user_id
        where r.status = 'pending' order by r.created_at`,
    )
    .all();
  if (!rows.length) console.log("No pending refund requests.");
  for (const r of rows) {
    // Отзыв (14 дней, Refund Policy §3): деньги вернуть в 14 календарных дней; возврат — решение за 3 рабочих.
    const due = r.kind === "withdrawal" ? new Date(r.created_at + 14 * 86_400_000) : addBusinessDays(r.created_at, 3);
    const late = due.getTime() < Date.now() ? "  OVERDUE" : "";
    console.log(`${r.kind === "withdrawal" ? "[WITHDRAWAL] " : ""}${r.id}  USD ${usd(r.amount_micros)}  ${new Date(r.created_at).toISOString().slice(0, 10)}  review by ${due.toISOString().slice(0, 10)}${late}  ${r.email}  ${r.reason ?? ""}`);
  }
  process.exit(0);
}

const usage = "Usage: npm run refund list | -- create <email> [--usd <x>] [reason] | approve <id> [usd] | reject <id> <reason>";
if ((cmd !== "approve" && cmd !== "reject") || !id) {
  console.error(usage);
  process.exit(1);
}
const note = cmd === "reject" ? rest.join(" ").trim() : "";
if (cmd === "reject" && !note) {
  console.error("Give the reason — the customer sees it in the dashboard. " + usage);
  process.exit(1);
}
let partial = null;
if (cmd === "approve" && rest[0] !== undefined) {
  const v = Number(rest[0]);
  if (!(v > 0)) {
    console.error(usage);
    process.exit(1);
  }
  partial = Math.round(v * 100) * 10_000;
}

const run = db.transaction(() => {
  const r = db.prepare("select * from refund_request where id = ?").get(id);
  if (!r) throw new Error(`Refund request ${id} not found`);
  if (r.status !== "pending") throw new Error(`Refund request is already ${r.status}`);
  if (partial !== null && partial > r.amount_micros) throw new Error(`The request is for USD ${usd(r.amount_micros)} — can't approve more.`);
  const now = Date.now();
  const release = (amount, ledgerNote) =>
    amount > 0 &&
    db.prepare("insert into ledger (id, user_id, kind, amount_micros, ref, note, created_at) values (?, ?, 'adjust', ?, ?, ?, ?)").run(
      randomUUID(),
      r.user_id,
      amount,
      `refund-release:${id}`,
      ledgerNote,
      now,
    );
  if (cmd === "approve") {
    const approved = partial ?? r.amount_micros;
    const rest = r.amount_micros - approved;
    const decision = rest > 0 ? `Partially approved: USD ${usd(approved)} of USD ${usd(r.amount_micros)} requested. USD ${usd(rest)} returned to your balance.` : null;
    // Сумма заявки = одобренная; запрошенная остаётся в decision_note и в проводках.
    db.prepare("update refund_request set status = 'approved', amount_micros = ?, decision_note = ?, updated_at = ? where id = ?").run(approved, decision, now, id);
    db.prepare("update ledger set note = 'Refunded to original payment method' where ref = ?").run(`refund:${id}`);
    if (rest > 0) release(rest, "Refund partially approved — rest of the hold released");
    return { r, approved, rest };
  }
  db.prepare("update refund_request set status = 'rejected', decision_note = ?, updated_at = ? where id = ?").run(note.slice(0, 500), now, id);
  release(r.amount_micros, "Refund request declined — hold released");
  return { r, approved: 0, rest: r.amount_micros };
});

try {
  const { r, approved, rest: released } = run();
  if (cmd === "approve") {
    console.log(`Approved: ${id}, USD ${usd(approved)}${released > 0 ? ` (USD ${usd(released)} of the hold returned to the balance)` : ""}`);
    if (r.kind === "withdrawal")
      console.log(`Withdrawal: send the refund by ${new Date(r.created_at + 14 * 86_400_000).toISOString().slice(0, 10)} (14 days from the notice, Refund Policy §3.2).`);
    else console.log(`Send the refund by ${addBusinessDays(Date.now(), 10).toISOString().slice(0, 10)} (10 business days, Refund Policy §2).`);
  } else {
    console.log(`Rejected: ${id}, USD ${usd(r.amount_micros)} returned to the balance. Reason shown to the customer: ${note}`);
  }
  if (anonymizeIfSettled(r.user_id)) console.log("Closed account — personal details anonymised.");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
