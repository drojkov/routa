/**
 * Сквозная проверка шлюза /v1 на запущенном сервере (npm run dev) с мок-апстримом:
 * ключ → предпроверка баланса → ответ → списание в ledger.
 *
 * Сервер должен быть запущен без ключей хостеров, иначе вместо мока пойдут живые запросы:
 *   DEEPINFRA_API_KEYS= TOGETHER_API_KEYS= npm run dev
 *
 *   node scripts/gateway-smoke.mjs            # http://localhost:3000, data/app.db
 *   BASE_URL=… DATABASE_PATH=… node scripts/gateway-smoke.mjs
 *
 * Заводит временного пользователя с ключом прямо в БД и удаляет его в конце.
 */
import Database from "better-sqlite3";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const db = new Database(process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db"));
db.pragma("foreign_keys = ON");

const OPEN = "deepseek/deepseek-v3.1";
const CLOSED = "anthropic/claude-sonnet-4.5";

function makeUser(balanceUsd) {
  const userId = `smoke-${randomUUID()}`;
  const plain = `sk-harvanera-${randomBytes(20).toString("hex")}`;
  const keyId = randomUUID();
  db.prepare("insert into user (id, name, email) values (?, ?, ?)").run(userId, "Smoke", `${userId}@example.com`);
  db.prepare("insert into api_key (id, user_id, name, prefix, hash) values (?, ?, ?, ?, ?)").run(
    keyId,
    userId,
    "smoke",
    "sk-harvanera-smoke",
    createHash("sha256").update(plain).digest("hex"),
  );
  if (balanceUsd) {
    db.prepare("insert into ledger (id, user_id, kind, amount_micros) values (?, ?, 'bonus', ?)").run(randomUUID(), userId, balanceUsd * 1e6);
  }
  return { userId, keyId, plain };
}

const balance = (userId) => db.prepare("select coalesce(sum(amount_micros), 0) as b from ledger where user_id = ?").get(userId).b;
const debit = (ref) => db.prepare("select amount_micros as a from ledger where ref = ? and kind = 'debit'").get(ref);

const chat = (key, body) =>
  fetch(`${BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(key ? { authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify(body),
  });

const messages = [{ role: "user", content: "Hello, gateway!" }];
const users = [];
let passed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.log(`  FAIL ${name}\n       ${e.message}`);
    process.exitCode = 1;
  }
}

try {
  const rich = makeUser(5);
  const broke = makeUser(0);
  users.push(rich, broke);

  await test("GET /v1/models — список с ценами и флагом available", async () => {
    const r = await fetch(`${BASE}/v1/models`);
    assert.equal(r.status, 200);
    const { data } = await r.json();
    assert.equal(data.find((m) => m.id === OPEN)?.available, true);
    assert.equal(data.find((m) => m.id === CLOSED)?.available, false);
    assert.ok(data[0].pricing.input > 0);
  });

  await test("без ключа → 401 invalid_api_key", async () => {
    const r = await chat(null, { model: OPEN, messages });
    assert.equal(r.status, 401);
    assert.equal((await r.json()).error.code, "invalid_api_key");
  });

  await test("закрытая модель → 503 model_unavailable", async () => {
    const r = await chat(rich.plain, { model: CLOSED, messages });
    assert.equal(r.status, 503);
    assert.equal((await r.json()).error.code, "model_unavailable");
  });

  await test("неизвестная модель → 404 model_not_found", async () => {
    const r = await chat(rich.plain, { model: "nope/nope", messages });
    assert.equal(r.status, 404);
  });

  await test("пустой баланс → 402 insufficient_balance", async () => {
    const r = await chat(broke.plain, { model: OPEN, messages });
    assert.equal(r.status, 402);
    assert.equal((await r.json()).error.code, "insufficient_balance");
  });

  await test("обычный ответ: наша модель в ответе, списание = x-cost-usd", async () => {
    const before = balance(rich.userId);
    const r = await chat(rich.plain, { model: OPEN, messages });
    assert.equal(r.status, 200);
    const id = r.headers.get("x-request-id");
    const json = await r.json();
    assert.equal(json.model, OPEN);
    assert.ok(json.choices[0].message.content.length > 0);
    assert.ok(json.usage.completion_tokens > 0);
    const cost = Math.round(Number(r.headers.get("x-cost-usd")) * 1e6);
    assert.ok(cost > 0, "cost > 0");
    assert.equal(debit(id)?.a, -cost);
    assert.equal(balance(rich.userId), before - cost);
  });

  await test("стрим без include_usage: чанки, [DONE], usage-чанк скрыт, списание есть", async () => {
    const r = await chat(rich.plain, { model: OPEN, messages, stream: true });
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /text\/event-stream/);
    const id = r.headers.get("x-request-id");
    const text = await r.text();
    const events = text.split("\n\n").filter(Boolean);
    assert.equal(events.at(-1), "data: [DONE]");
    const chunks = events.slice(0, -1).map((e) => JSON.parse(e.slice(6)));
    assert.ok(chunks.every((c) => c.model === OPEN));
    assert.ok(chunks.every((c) => !c.usage));
    assert.ok(chunks.map((c) => c.choices[0]?.delta?.content ?? "").join("").includes("Hello, gateway!"));
    assert.ok(debit(id)?.a < 0);
  });

  await test("стрим с include_usage: последний чанк с usage", async () => {
    const r = await chat(rich.plain, { model: OPEN, messages, stream: true, stream_options: { include_usage: true } });
    const events = (await r.text()).split("\n\n").filter(Boolean);
    const last = JSON.parse(events.at(-2).slice(6));
    assert.ok(last.usage.completion_tokens > 0);
  });

  await test("обрыв стрима клиентом: списание за полученное", async () => {
    const ctrl = new AbortController();
    const r = await fetch(`${BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${rich.plain}` },
      body: JSON.stringify({ model: OPEN, messages, stream: true }),
      signal: ctrl.signal,
    });
    const id = r.headers.get("x-request-id");
    const reader = r.body.getReader();
    await reader.read();
    await reader.read();
    ctrl.abort();
    await new Promise((res) => setTimeout(res, 500));
    const row = db.prepare("select error_code as e, estimated as est from request_log where id = ?").get(id);
    assert.equal(row?.e, "client_aborted");
    assert.equal(row?.est, 1);
  });

  await test("GET /v1/balance", async () => {
    const r = await fetch(`${BASE}/v1/balance`, { headers: { authorization: `Bearer ${rich.plain}` } });
    assert.equal(r.status, 200);
    const b = await r.json();
    assert.equal(b.currency, "USD");
    assert.equal(Math.round(b.balance * 1e6), balance(rich.userId));
  });

  await test("ключ с белым списком моделей: чужая модель → 403, своя → 200", async () => {
    db.prepare("update api_key set allowed_models = ? where id = ?").run(JSON.stringify(["qwen/qwen3-coder"]), rich.keyId);
    const denied = await chat(rich.plain, { model: OPEN, messages });
    assert.equal(denied.status, 403);
    assert.equal((await denied.json()).error.code, "model_not_allowed");
    const ok = await chat(rich.plain, { model: "qwen/qwen3-coder", messages });
    assert.equal(ok.status, 200);
    db.prepare("update api_key set allowed_models = null where id = ?").run(rich.keyId);
  });

  await test("ключ на паузе → 401, после снятия паузы → 200", async () => {
    db.prepare("update api_key set disabled_at = ? where id = ?").run(Date.now(), rich.keyId);
    assert.equal((await chat(rich.plain, { model: OPEN, messages })).status, 401);
    db.prepare("update api_key set disabled_at = null where id = ?").run(rich.keyId);
    assert.equal((await chat(rich.plain, { model: OPEN, messages })).status, 200);
  });

  await test("чат кабинета без входа → 401", async () => {
    const r = await fetch(`${BASE}/api/playground/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: OPEN, messages }) });
    assert.equal(r.status, 401);
  });

  const content = (id) => db.prepare("select request, response from request_content where id = ?").get(id);

  await test("логирование выключено → текст не сохраняется", async () => {
    const r = await chat(rich.plain, { model: OPEN, messages });
    assert.equal(r.status, 200);
    assert.equal(content(r.headers.get("x-request-id")), undefined);
  });

  await test("логирование включено → запрос и ответ сохранены (обычный и стрим)", async () => {
    db.prepare("update user set log_content = 1 where id = ?").run(rich.userId);
    const r = await chat(rich.plain, { model: OPEN, messages });
    const json = await r.json();
    const saved = content(r.headers.get("x-request-id"));
    assert.deepEqual(JSON.parse(saved.request), messages);
    assert.equal(saved.response, json.choices[0].message.content);

    const s = await chat(rich.plain, { model: OPEN, messages, stream: true });
    const text = (await s.text())
      .split("\n\n")
      .filter((e) => e.startsWith("data: {"))
      .map((e) => JSON.parse(e.slice(6)).choices[0]?.delta?.content ?? "")
      .join("");
    assert.equal(content(s.headers.get("x-request-id"))?.response, text);
    db.prepare("update user set log_content = 0 where id = ?").run(rich.userId);
  });

  await test("отозванный ключ → 401", async () => {
    db.prepare("update api_key set revoked_at = ? where id = ?").run(Date.now(), rich.keyId);
    const r = await chat(rich.plain, { model: OPEN, messages });
    assert.equal(r.status, 401);
  });
} finally {
  for (const u of users) db.prepare("delete from user where id = ?").run(u.userId);
  db.close();
}

console.log(`\n${passed} passed${process.exitCode ? ", some FAILED" : ""}`);
