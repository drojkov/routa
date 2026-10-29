#!/usr/bin/env node
/**
 * Обращения из формы /contact (таблица contact_message, lib/actions/contact.ts).
 *
 *   npm run contact list               # необработанные сначала (затем последние обработанные): тема, email, дата, начало текста
 *   npm run contact show <id>          # полностью; id можно сокращать до первых символов
 *   npm run contact done <id>          # отметить обработанным (ответили клиенту)
 *
 * База — DATABASE_PATH или data/app.db (на сервере: docker compose exec web npm run contact …).
 * Сообщения старше 24 месяцев удаляются сами (db/index.ts, Privacy §7).
 */
import Database from "better-sqlite3";
import path from "node:path";

const [cmd, id] = process.argv.slice(2);
const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
const db = new Database(file, { fileMustExist: true });
db.pragma("foreign_keys = ON");
const day = (ms) => new Date(ms).toISOString().slice(0, 16).replace("T", " ");

function die(msg) {
  console.error(msg);
  process.exit(1);
}
function byId(ref) {
  if (!ref) die("Message id is required.");
  const rows = db.prepare("select * from contact_message where id like ? || '%'").all(ref);
  if (rows.length !== 1) die(rows.length ? "Several messages match — use more characters of the id." : `No message ${ref}`);
  return rows[0];
}

if (cmd === "list") {
  const open = db.prepare("select * from contact_message where handled_at is null order by created_at").all();
  const done = db.prepare("select * from contact_message where handled_at is not null order by handled_at desc limit 10").all();
  if (!open.length) console.log("No open messages.");
  for (const [title, rows] of [
    ["OPEN", open],
    ["HANDLED (last 10)", done],
  ]) {
    if (!rows.length) continue;
    console.log(`\n${title}`);
    for (const m of rows) {
      const text = m.message.replace(/\s+/g, " ");
      console.log(`${m.id.slice(0, 8)}  ${day(m.created_at)}  [${m.topic}]  ${m.email}${m.user_id ? "" : " (guest)"}  ${text.slice(0, 70)}${text.length > 70 ? "…" : ""}`);
    }
  }
  process.exit(0);
}

if (cmd === "show") {
  const m = byId(id);
  console.log(`id:      ${m.id}`);
  console.log(`date:    ${day(m.created_at)} UTC`);
  console.log(`from:    ${m.name} <${m.email}>${m.user_id ? `  user ${m.user_id}` : "  (guest)"}`);
  console.log(`topic:   ${m.topic}`);
  console.log(`ip:      ${m.ip_address ?? "—"}`);
  console.log(`status:  ${m.handled_at ? `handled ${day(m.handled_at)}` : "open"}`);
  console.log(`\n${m.message}`);
  process.exit(0);
}

if (cmd === "done") {
  const m = byId(id);
  if (m.handled_at) die(`Already handled ${day(m.handled_at)}.`);
  db.prepare("update contact_message set handled_at = ? where id = ?").run(Date.now(), m.id);
  console.log(`Marked handled: ${m.id} (${m.email}, ${m.topic}).`);
  process.exit(0);
}

die("Usage: npm run contact list | show <id> | done <id>");
