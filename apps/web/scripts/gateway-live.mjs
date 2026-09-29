/**
 * Живая проверка шлюза с настоящими ключами хостеров (тратит доли цента):
 * по короткому запросу к каждой доступной модели + один стрим, сверка списания с usage.
 *
 *   node scripts/gateway-live.mjs      # нужен запущенный npm run dev с ключами в .env.local
 */
import Database from "better-sqlite3";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const db = new Database(process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db"));
db.pragma("foreign_keys = ON");

const userId = `live-${randomUUID()}`;
const plain = `sk-harvanera-${randomBytes(20).toString("hex")}`;
db.prepare("insert into user (id, name, email) values (?, ?, ?)").run(userId, "Live", `${userId}@example.com`);
db.prepare("insert into api_key (id, user_id, name, prefix, hash) values (?, ?, ?, ?, ?)").run(
  randomUUID(),
  userId,
  "live",
  "sk-harvanera-live",
  createHash("sha256").update(plain).digest("hex"),
);
db.prepare("insert into ledger (id, user_id, kind, amount_micros) values (?, ?, 'bonus', 1000000)").run(randomUUID(), userId);

const log = (id) => db.prepare("select provider, input_tokens i, output_tokens o, cost_micros c from request_log where id = ?").get(id);
const chat = (body) =>
  fetch(`${BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${plain}` },
    body: JSON.stringify({ messages: [{ role: "user", content: "Reply with one word: ping" }], max_tokens: 400, ...body }),
  });

try {
  const { data } = await (await fetch(`${BASE}/v1/models`)).json();
  const models = data.filter((m) => m.available);
  for (const m of models) {
    const r = await chat({ model: m.id });
    const id = r.headers.get("x-request-id");
    const j = await r.json();
    const row = log(id);
    const expected = row ? Math.ceil(row.i * m.pricing.input + row.o * m.pricing.output) : null;
    const text = j.choices?.[0]?.message?.content ?? j.error?.message;
    console.log(
      `${r.status === 200 && row?.c === expected ? "ok  " : "FAIL"} ${m.id.padEnd(28)} ${r.status} via ${row?.provider} ` +
        `in=${row?.i} out=${row?.o} cost=$${(row?.c ?? 0) / 1e6} | ${JSON.stringify(String(text).slice(0, 60))}`,
    );
    if (r.status !== 200) process.exitCode = 1;
  }

  const r = await chat({ model: models[0].id, stream: true });
  const id = r.headers.get("x-request-id");
  const events = (await r.text()).split("\n\n").filter(Boolean);
  await new Promise((res) => setTimeout(res, 300));
  const row = log(id);
  const ok = events.at(-1) === "data: [DONE]" && row?.o > 0 && row?.c > 0;
  console.log(`${ok ? "ok  " : "FAIL"} stream ${models[0].id}: ${events.length} events, out=${row?.o}, cost=$${(row?.c ?? 0) / 1e6}`);
  if (!ok) process.exitCode = 1;
} finally {
  db.prepare("delete from user where id = ?").run(userId);
  db.close();
}
