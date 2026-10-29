#!/usr/bin/env node
/**
 * Действия поддержки с аккаунтами (Terms §11, AUP §4, Refund Policy §5).
 *
 *   npm run account show <email>                       # статус, баланс, ключи, блокировки
 *   npm run account suspend <email> [reason]           # заблокировать: вход и API закрыты, сессии сброшены
 *   npm run account unsuspend <email>
 *   npm run account block-key <key-id|prefix>          # заблокировать ключ (владелец сам не включит)
 *   npm run account unblock-key <key-id|prefix>
 *   npm run account block-model <email> <model-id>     # закрыть модель этому аккаунту
 *   npm run account unblock-model <email> <model-id>
 *   npm run account credit <email> <usd> <reason>      # исправить ошибку списания: зачислить на баланс
 *   npm run account debit <email> <usd> <reason>       # исправить ошибку в пользу клиента: списать (не ниже нуля)
 *   npm run account verify-email <email>               # отметить email подтверждённым (пока письма не уходят)
 *   npm run account rename <email> <new name>          # исправить имя по просьбе клиента (Privacy §9)
 *   npm run account set-email <email> <new email>      # сменить email: подтверждение сбрасывается
 *   npm run account export <email> > data.json         # выгрузка данных, как /api/account/export (запрос по почте)
 *   npm run account close <email>                      # закрыть по письму клиента (как кнопка в кабинете)
 *   npm run account invoices                           # запрошенные счета для компаний (Terms §5.2)
 *   npm run account invoice-paid <payment-id>          # деньги по счёту пришли: зачислить и отправить подтверждение
 *     (идёт через работающий сервер: нужен ADMIN_TOKEN в окружении сервера и скрипта; PORT — порт сервера, по умолчанию 3000)
 *
 * База — DATABASE_PATH или data/app.db (на сервере: docker compose exec web npm run account …).
 * Закрытие повторяет lib/account-close.ts: правки вносить в оба места.
 */
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import path from "node:path";

const [cmd, ...args] = process.argv.slice(2);
const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
const db = new Database(file, { fileMustExist: true });
db.pragma("foreign_keys = ON");
const usd = (m) => (m / 1_000_000).toFixed(2);
const now = Date.now();

function die(msg) {
  console.error(msg);
  process.exit(1);
}
function userByEmail(email) {
  if (!email) die("Email is required.");
  const u = db.prepare("select * from user where lower(email) = lower(?)").get(email);
  if (!u) die(`No user with email ${email}`);
  return u;
}
function keyByRef(ref) {
  if (!ref) die("Key id or prefix is required.");
  const k = db.prepare("select * from api_key where id = ? or prefix = ?").all(ref, ref);
  if (k.length !== 1) die(k.length ? "Several keys match — use the key id." : `No key ${ref}`);
  return k[0];
}
const sum = (sql, ...p) => Number(db.prepare(sql).get(...p)?.v ?? 0);
/** Как refundableMicrosTx в lib/refunds.ts. */
function refundable(userId) {
  const balance = sum("select coalesce(sum(amount_micros),0) v from ledger where user_id = ?", userId);
  const paid = sum("select coalesce(sum(amount_micros),0) v from ledger where user_id = ? and kind = 'topup'", userId);
  const refunded = sum("select coalesce(sum(amount_micros),0) v from ledger where user_id = ? and kind = 'refund'", userId);
  const back = sum(
    "select coalesce(sum(amount_micros),0) v from ledger where user_id = ? and kind = 'adjust' and (ref like 'refund-release:%' or ref like 'correction:%')",
    userId,
  );
  return Math.max(0, Math.min(balance, paid + refunded + back));
}
/** Строка SQLite → как в выгрузке через Drizzle: camelCase, даты ISO, JSON-поля разобраны, флаги — boolean. */
const BOOL = new Set(["email_verified", "log_content", "stream", "estimated"]);
const JSON_COLS = new Set(["allowed_models", "blocked_models"]);
function row(r) {
  const out = {};
  for (const [k, v] of Object.entries(r)) {
    const key = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (v == null) out[key] = v;
    else if (k.endsWith("_at")) out[key] = new Date(v);
    else if (BOOL.has(k)) out[key] = !!v;
    else if (JSON_COLS.has(k)) out[key] = JSON.parse(v);
    else out[key] = v;
  }
  return out;
}
function models(u) {
  return u.blocked_models ? JSON.parse(u.blocked_models) : [];
}

const commands = {
  show() {
    const u = userByEmail(args[0]);
    const balance = sum("select coalesce(sum(amount_micros),0) v from ledger where user_id = ?", u.id);
    console.log(`${u.email}  id=${u.id}`);
    console.log(`created ${new Date(u.created_at).toISOString()}  verified=${!!u.email_verified}`);
    console.log(`closed: ${u.closed_at ? new Date(u.closed_at).toISOString() : "no"}  suspended: ${u.suspended_at ? `${new Date(u.suspended_at).toISOString()} (${u.suspend_reason ?? ""})` : "no"}`);
    console.log(`balance USD ${usd(balance)}  refundable USD ${usd(refundable(u.id))}  blocked models: ${models(u).join(", ") || "—"}`);
    for (const k of db.prepare("select * from api_key where user_id = ? order by created_at").all(u.id)) {
      const st = k.revoked_at ? "revoked" : k.blocked_at ? "BLOCKED" : k.disabled_at ? "paused" : "active";
      console.log(`  key ${k.id}  ${k.prefix}…  ${k.name}  ${st}`);
    }
  },
  suspend() {
    const u = userByEmail(args[0]);
    const reason = args.slice(1).join(" ") || null;
    db.transaction(() => {
      db.prepare("update user set suspended_at = ?, suspend_reason = ?, updated_at = ? where id = ?").run(now, reason, now, u.id);
      db.prepare("delete from session where user_id = ?").run(u.id);
    })();
    console.log(`Suspended ${u.email}. Tell the customer why (Terms §11.2), unless that is unlawful or unsafe.`);
  },
  unsuspend() {
    const u = userByEmail(args[0]);
    db.prepare("update user set suspended_at = null, suspend_reason = null, updated_at = ? where id = ?").run(now, u.id);
    console.log(`Unsuspended ${u.email}.`);
  },
  "block-key"() {
    const k = keyByRef(args[0]);
    db.prepare("update api_key set blocked_at = ? where id = ?").run(now, k.id);
    console.log(`Blocked key ${k.prefix}… (${k.name}).`);
  },
  "unblock-key"() {
    const k = keyByRef(args[0]);
    db.prepare("update api_key set blocked_at = null where id = ?").run(k.id);
    console.log(`Unblocked key ${k.prefix}… (${k.name}).`);
  },
  "block-model"() {
    const u = userByEmail(args[0]);
    if (!args[1]) die("Model id is required (e.g. meta-llama/llama-4-scout).");
    const list = [...new Set([...models(u), args[1]])];
    db.prepare("update user set blocked_models = ?, updated_at = ? where id = ?").run(JSON.stringify(list), now, u.id);
    console.log(`Blocked models for ${u.email}: ${list.join(", ")}`);
  },
  "unblock-model"() {
    const u = userByEmail(args[0]);
    const list = models(u).filter((m) => m !== args[1]);
    db.prepare("update user set blocked_models = ?, updated_at = ? where id = ?").run(list.length ? JSON.stringify(list) : null, now, u.id);
    console.log(`Blocked models for ${u.email}: ${list.join(", ") || "—"}`);
  },
  credit() {
    const u = userByEmail(args[0]);
    const amount = Number(args[1]);
    const reason = args.slice(2).join(" ");
    if (!(amount > 0) || !reason) die("Usage: credit <email> <usd> <reason>");
    const micros = Math.round(amount * 1_000_000);
    db.prepare("insert into ledger (id, user_id, kind, amount_micros, ref, note, created_at) values (?, ?, 'adjust', ?, ?, ?, ?)").run(
      randomUUID(),
      u.id,
      micros,
      `correction:${randomUUID()}`,
      `Billing correction: ${reason}`.slice(0, 200),
      now,
    );
    console.log(`Credited USD ${usd(micros)} to ${u.email} (refundable as paid balance).`);
  },
  debit() {
    const u = userByEmail(args[0]);
    const amount = Number(args[1]);
    const reason = args.slice(2).join(" ");
    if (!(amount > 0) || !reason) die("Usage: debit <email> <usd> <reason>");
    const micros = Math.round(amount * 1_000_000);
    const res = db.transaction(() => {
      const balance = sum("select coalesce(sum(amount_micros),0) v from ledger where user_id = ?", u.id);
      if (balance - micros < 0) return { error: `Balance is USD ${usd(balance)} — a debit of USD ${usd(micros)} would make it negative. Debit at most the balance.` };
      // ref не 'correction:' — списание считается расходом, а не уменьшением оплаченного (refundable в lib/refunds.ts).
      db.prepare("insert into ledger (id, user_id, kind, amount_micros, ref, note, created_at) values (?, ?, 'adjust', ?, ?, ?, ?)").run(
        randomUUID(),
        u.id,
        -micros,
        `debit-correction:${randomUUID()}`,
        `Billing correction: ${reason}`.slice(0, 200),
        now,
      );
      return { balance: balance - micros };
    })();
    if (res.error) die(res.error);
    console.log(`Debited USD ${usd(micros)} from ${u.email}. Balance now USD ${usd(res.balance)}. Tell the customer why.`);
  },
  "verify-email"() {
    const u = userByEmail(args[0]);
    db.prepare("update user set email_verified = 1, updated_at = ? where id = ?").run(now, u.id);
    console.log(`Email ${u.email} marked as verified.`);
  },
  rename() {
    const u = userByEmail(args[0]);
    const name = args.slice(1).join(" ").trim();
    if (!name) die("Usage: rename <email> <new name>");
    db.prepare("update user set name = ?, updated_at = ? where id = ?").run(name.slice(0, 100), now, u.id);
    console.log(`Renamed ${u.email}: "${u.name}" → "${name.slice(0, 100)}".`);
  },
  "set-email"() {
    const u = userByEmail(args[0]);
    const email = (args[1] ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) die("Usage: set-email <email> <new email>");
    if (db.prepare("select 1 from user where lower(email) = ? and id != ?").get(email, u.id)) die(`Email ${email} is already used by another account.`);
    db.prepare("update user set email = ?, email_verified = 0, updated_at = ? where id = ?").run(email, now, u.id);
    console.log(`Email changed: ${u.email} → ${email}. Not verified — confirm ownership, then npm run account verify-email ${email}`);
  },
  export() {
    // Копия /api/account/export (app/api/account/export/route.ts): правки вносить в оба места.
    const u = userByEmail(args[0]);
    const all = (sql, ...p) => db.prepare(sql).all(...p).map(row);
    const cutoff = now - 30 * 86_400_000; // CONTENT_RETENTION_DAYS (lib/request-content.ts)
    const data = {
      exportedAt: new Date(now),
      profile: row(u),
      signInMethods: all("select provider_id as provider, created_at from account where user_id = ?", u.id),
      activeSessions: all("select created_at, expires_at, ip_address, user_agent from session where user_id = ?", u.id),
      apiKeys: all(
        "select name, prefix, limit_micros, allowed_models, created_at, last_used_at, disabled_at, blocked_at, revoked_at from api_key where user_id = ?",
        u.id,
      ),
      ledger: all("select * from ledger where user_id = ? order by created_at desc", u.id),
      payments: all("select * from payment where user_id = ? order by created_at desc", u.id),
      refundRequests: all("select * from refund_request where user_id = ? order by created_at desc", u.id),
      signInHistory: all("select * from login_event where user_id = ? order by created_at desc", u.id),
      requestLog: all("select * from request_log where user_id = ? order by created_at desc", u.id),
      contactMessages: all("select * from contact_message where user_id = ? order by created_at desc", u.id),
      requestContent: all(
        "select id as request_id, request, response, created_at from request_content where user_id = ? and created_at >= ? order by created_at desc",
        u.id,
        cutoff,
      ),
    };
    process.stdout.write(JSON.stringify(data, null, 2) + "\n");
  },
  close() {
    const u = userByEmail(args[0]);
    if (u.closed_at) die("Account is already closed.");
    const res = db.transaction(() => {
      let refund = null;
      const pending = db.prepare("select id from refund_request where user_id = ? and status = 'pending'").get(u.id);
      const amount = refundable(u.id);
      if (!pending && amount >= 10_000) {
        const id = randomUUID();
        db.prepare("insert into refund_request (id, user_id, amount_micros, status, reason, created_at, updated_at) values (?, ?, ?, 'pending', 'Account closure (by email)', ?, ?)").run(id, u.id, amount, now, now);
        db.prepare("insert into ledger (id, user_id, kind, amount_micros, ref, note, created_at) values (?, ?, 'refund', ?, ?, 'Refund requested', ?)").run(randomUUID(), u.id, -amount, `refund:${id}`, now);
        refund = { id, amount };
      }
      db.prepare("update user set closed_at = ?, log_content = 0, updated_at = ? where id = ?").run(now, now, u.id);
      db.prepare("update api_key set revoked_at = ? where user_id = ? and revoked_at is null").run(now, u.id);
      db.prepare("delete from request_content where user_id = ?").run(u.id);
      db.prepare("delete from session where user_id = ?").run(u.id);
      db.prepare("delete from account where user_id = ?").run(u.id);
      if (!pending && !refund) {
        const closed = `closed-${u.id}@closed.invalid`;
        db.prepare("update contact_message set name = 'Closed account', email = ?, user_id = ? where user_id = ? or lower(email) = lower(?)").run(closed, u.id, u.id, u.email);
        db.prepare("update user set email = ?, name = 'Closed account', image = null, email_verified = 0 where id = ?").run(closed, u.id);
      }
      return { refund, pending };
    })();
    console.log(`Closed ${u.email}.`);
    if (res.refund) console.log(`Refund request ${res.refund.id} for USD ${usd(res.refund.amount)} created and held — see npm run refund list. Email is kept until it is resolved.`);
    else if (res.pending) console.log("A refund request is pending — email is kept until it is resolved.");
    else console.log("No refundable balance — personal details anonymised.");
  },
  invoices() {
    const rows = db
      .prepare(
        `select p.id, p.amount_micros, p.status, p.created_at, p.billing_details, u.email from payment p join user u on u.id = p.user_id
          where p.method = 'invoice' and p.status in ('pending', 'canceled') order by p.created_at desc limit 50`,
      )
      .all();
    if (!rows.length) console.log("No unpaid invoice requests.");
    for (const r of rows) {
      console.log(`${r.id}  USD ${usd(r.amount_micros)}  ${new Date(r.created_at).toISOString().slice(0, 10)}  ${r.status}  ${r.email}`);
      console.log(`    ${String(r.billing_details ?? "").replace(/\n/g, "\n    ")}`);
    }
  },
  async "invoice-paid"() {
    const id = args[0];
    if (!id) die("Payment id is required.");
    const token = process.env.ADMIN_TOKEN;
    if (!token) die("Set ADMIN_TOKEN (the same as on the server).");
    const res = await fetch(`http://127.0.0.1:${process.env.PORT ?? 3000}/api/admin/credit`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ paymentId: id, provider: "invoice" }),
    });
    const body = await res.text();
    if (!res.ok) die(`Server answered ${res.status}: ${body}`);
    console.log(body);
  },
};

if (!commands[cmd]) die(`Usage: npm run account ${Object.keys(commands).join(" | ")} …  (see the header of scripts/account.mjs)`);
await commands[cmd]();
