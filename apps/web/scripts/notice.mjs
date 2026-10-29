#!/usr/bin/env node
/**
 * Уведомления в кабинете (Terms §17, §19 — «notify you by email or in the dashboard»).
 * Показываются плашкой в шапке кабинета, пока не истекли; пользователь может скрыть (таблица notice_dismissal).
 *
 *   npm run notice -- add "<title>" "<body>" [--user <email>] [--days N]   # всем или одному; --days — срок показа
 *     (`--` после notice обязателен, если есть флаги: иначе npm заберёт --user/--days себе)
 *   npm run notice list                                                  # активные и недавно истёкшие
 *   npm run notice remove <id>                                           # убрать (id можно сокращать)
 *
 * Текст — на английском, показывается как введён (без перевода). Пустая строка в body — новый абзац.
 * База — DATABASE_PATH или data/app.db (на сервере: docker compose exec web npm run notice …).
 */
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import path from "node:path";

const [cmd, ...args] = process.argv.slice(2);
const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
const db = new Database(file, { fileMustExist: true });
db.pragma("foreign_keys = ON");
const day = (ms) => new Date(ms).toISOString().slice(0, 16).replace("T", " ");
const usage = 'Usage: npm run notice -- add "<title>" "<body>" [--user <email>] [--days N] | list | remove <id>';

function die(msg) {
  console.error(msg);
  process.exit(1);
}

if (cmd === "add") {
  // Без `--` npm забирает --user/--days себе, а их значения остаются лишними аргументами.
  for (const f of ["user", "days"]) {
    if (process.env[`npm_config_${f}`] !== undefined && !args.includes(`--${f}`)) die(`npm swallowed --${f}. ${usage}`);
  }
  const rest = [...args];
  const opt = (name) => {
    const i = rest.indexOf(name);
    if (i === -1) return null;
    const v = rest[i + 1];
    if (v === undefined) die(`${name} needs a value. ${usage}`);
    rest.splice(i, 2);
    return v;
  };
  const email = opt("--user");
  const days = opt("--days");
  const [title, body] = rest;
  if (!title?.trim() || !body?.trim() || rest.length > 2) die(usage);
  let userId = null;
  if (email) {
    const u = db.prepare("select id, email from user where lower(email) = lower(?)").get(email);
    if (!u) die(`No user with email ${email}`);
    userId = u.id;
  }
  if (days !== null && !(Number(days) > 0)) die("--days must be a positive number.");
  const now = Date.now();
  const expires = days !== null ? now + Number(days) * 86_400_000 : null;
  const id = randomUUID();
  db.prepare("insert into notice (id, user_id, title, body, expires_at, created_at) values (?, ?, ?, ?, ?, ?)").run(id, userId, title.trim(), body.trim(), expires, now);
  console.log(`Added ${id.slice(0, 8)} for ${email ?? "all users"}${expires ? `, until ${day(expires)} UTC` : ", no expiry"}.`);
  process.exit(0);
}

if (cmd === "list") {
  const rows = db
    .prepare(
      `select n.*, u.email, (select count(*) from notice_dismissal d where d.notice_id = n.id) dismissed
         from notice n left join user u on u.id = n.user_id
        where n.expires_at is null or n.expires_at > ? order by n.created_at desc`,
    )
    .all(Date.now() - 30 * 86_400_000);
  if (!rows.length) console.log("No notices.");
  for (const n of rows) {
    const expired = n.expires_at && n.expires_at < Date.now() ? "  EXPIRED" : "";
    console.log(
      `${n.id.slice(0, 8)}  ${day(n.created_at)}  ${n.user_id ? n.email : "ALL"}  until ${n.expires_at ? day(n.expires_at) : "—"}${expired}  dismissed by ${n.dismissed}`,
    );
    console.log(`    ${n.title}: ${n.body.replace(/\s+/g, " ").slice(0, 100)}`);
  }
  process.exit(0);
}

if (cmd === "remove") {
  if (!args[0]) die(usage);
  const rows = db.prepare("select id, title from notice where id like ? || '%'").all(args[0]);
  if (rows.length !== 1) die(rows.length ? "Several notices match — use more characters of the id." : `No notice ${args[0]}`);
  db.prepare("delete from notice where id = ?").run(rows[0].id);
  console.log(`Removed ${rows[0].id.slice(0, 8)}: ${rows[0].title}`);
  process.exit(0);
}

die(usage);
