#!/usr/bin/env node
/**
 * Пакет доказательств по заказу — для ответа на чарджбэк или запрос эквайера.
 *
 *   node scripts/evidence.mjs <payment-id>            # JSON в stdout
 *   node scripts/evidence.mjs <payment-id> > case.json
 *
 * База — DATABASE_PATH или data/app.db. На сервере: `docker compose exec web npm run evidence <id>`.
 *
 * Что внутри: аккаунт (дата регистрации, подтверждён ли email), заказ (сумма, IP, страна, браузер,
 * время согласия на немедленное начало услуги), входы в аккаунт до и после оплаты, проводки баланса,
 * запросы к API после оплаты (расход токенов) и заявки на возврат.
 */
import Database from "better-sqlite3";
import path from "node:path";

const id = process.argv[2];
if (!id) {
  console.error("Usage: node scripts/evidence.mjs <payment-id>");
  process.exit(1);
}
const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
const db = new Database(file, { readonly: true, fileMustExist: true });
const iso = (ms) => (ms == null ? null : new Date(ms).toISOString());

const order = db.prepare("select * from payment where id = ? or id like ?").get(id, `${id.toLowerCase()}%`);
if (!order) {
  console.error(`Payment ${id} not found in ${file}`);
  process.exit(1);
}
const user = db.prepare("select id, name, email, email_verified, created_at from user where id = ?").get(order.user_id);
const logins = db
  .prepare("select created_at, ip_address, country, user_agent from login_event where user_id = ? order by created_at")
  .all(order.user_id);
const ledger = db.prepare("select created_at, kind, amount_micros, ref, note from ledger where user_id = ? order by created_at").all(order.user_id);
const usage = db
  .prepare(
    `select count(*) as requests, coalesce(sum(input_tokens),0) as input_tokens, coalesce(sum(output_tokens),0) as output_tokens,
            coalesce(sum(cost_micros),0) as cost_micros, min(created_at) as first_at, max(created_at) as last_at
       from request_log where user_id = ? and status < 400 and created_at >= ?`,
  )
  .get(order.user_id, order.updated_at);
const byModel = db
  .prepare(
    `select model, count(*) as requests, sum(input_tokens) as input_tokens, sum(output_tokens) as output_tokens, sum(cost_micros) as cost_micros
       from request_log where user_id = ? and status < 400 and created_at >= ? group by model order by cost_micros desc`,
  )
  .all(order.user_id, order.updated_at);
const sample = db
  .prepare(
    `select r.id, r.created_at, r.model, r.input_tokens, r.output_tokens, r.cost_micros, k.prefix as api_key
       from request_log r left join api_key k on k.id = r.api_key_id
      where r.user_id = ? and r.status < 400 and r.created_at >= ? order by r.created_at limit 50`,
  )
  .all(order.user_id, order.updated_at);
const keys = db.prepare("select prefix, name, created_at, last_used_at, revoked_at from api_key where user_id = ?").all(order.user_id);
const refunds = db.prepare("select id, amount_micros, status, created_at, ip_address from refund_request where user_id = ?").all(order.user_id);

const usd = (m) => Math.round(m) / 1_000_000;
const minor = order.currency === "JPY" ? 1 : 100;
console.log(
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      account: { id: user.id, name: user.name, email: user.email, emailVerified: !!user.email_verified, createdAt: iso(user.created_at) },
      order: {
        id: order.id,
        status: order.status,
        amountPaid: `${order.currency} ${(order.amount_minor / minor).toFixed(minor === 1 ? 0 : 2)}`,
        creditedUsd: usd(order.amount_micros),
        provider: order.provider,
        providerRef: order.provider_ref,
        createdAt: iso(order.created_at),
        paidAt: order.status === "paid" ? iso(order.updated_at) : null,
        ipAddress: order.ip_address,
        country: order.country,
        userAgent: order.user_agent,
        immediateStartConsentAt: iso(order.waiver_at),
      },
      logins: logins.map((l) => ({ at: iso(l.created_at), ip: l.ip_address, country: l.country, userAgent: l.user_agent })),
      usageAfterPayment: {
        requests: usage.requests,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        spentUsd: usd(usage.cost_micros),
        firstRequestAt: iso(usage.first_at),
        lastRequestAt: iso(usage.last_at),
        byModel: byModel.map((m) => ({ ...m, cost_micros: undefined, spentUsd: usd(m.cost_micros) })),
        first50: sample.map((r) => ({ requestId: r.id, at: iso(r.created_at), model: r.model, apiKey: r.api_key ?? "dashboard chat", inputTokens: r.input_tokens, outputTokens: r.output_tokens, costUsd: usd(r.cost_micros) })),
      },
      apiKeys: keys.map((k) => ({ ...k, created_at: iso(k.created_at), last_used_at: iso(k.last_used_at), revoked_at: iso(k.revoked_at) })),
      ledger: ledger.map((e) => ({ at: iso(e.created_at), kind: e.kind, usd: usd(e.amount_micros), ref: e.ref, note: e.note })),
      refundRequests: refunds.map((r) => ({ id: r.id, usd: usd(r.amount_micros), status: r.status, at: iso(r.created_at), ip: r.ip_address })),
    },
    null,
    2,
  ),
);
