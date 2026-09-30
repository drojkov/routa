/**
 * Обновляет базу стран по IP (DB-IP Lite, CC BY 4.0) для геоблокировки (src/lib/geo.ts).
 * DB-IP выпускает новую базу каждый месяц; запускать раз в месяц и коммитить файл.
 *
 *   npm run geo:update
 */
import fs from "node:fs";
import path from "node:path";

const now = new Date();
const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
const url = `https://download.db-ip.com/free/dbip-country-lite-${month}.mmdb.gz`;
const out = path.join(process.cwd(), "geo", "dbip-country-lite.mmdb.gz");

const res = await fetch(url);
if (!res.ok) {
  console.error(`Не удалось скачать ${url}: ${res.status}. В начале месяца новой базы может ещё не быть — повторите позже.`);
  process.exit(1);
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
console.log(`OK: ${url} → ${out}`);
