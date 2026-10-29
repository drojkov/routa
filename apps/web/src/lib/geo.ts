import { timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import { BlockList, isIP, isIPv6 } from "node:net";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { type CountryResponse, Reader } from "maxmind";

/**
 * Геоблокировка сервиса (Terms §2). Страна — по IP из базы DB-IP Lite (CC BY 4.0, ссылка на DB-IP
 * обязательна — стоит в футере). База лежит в geo/, обновлять раз в месяц: `npm run geo:update`.
 *
 * Регионы (Крым, Севастополь, Донецк, Луганск, Запорожье, Херсон) по IP уровня страны не отличить —
 * их закрывает только проверка у платёжного провайдера.
 */

/** Страны из Terms §2 (ISO 3166-1 alpha-2). Меняется Terms — меняется и этот список. */
export const BLOCKED_COUNTRIES = new Set([
  "AF", // Afghanistan
  "DZ", // Algeria
  "AS", // American Samoa
  "AO", // Angola
  "BY", // Belarus
  "BO", // Bolivia
  "BA", // Bosnia and Herzegovina
  "VG", // British Virgin Islands
  "BG", // Bulgaria
  "CM", // Cameroon
  "CF", // Central African Republic
  "CN", // China
  "CI", // Côte d'Ivoire
  "CU", // Cuba
  "CD", // Democratic Republic of the Congo
  "GT", // Guatemala
  "GN", // Guinea
  "GW", // Guinea-Bissau
  "HT", // Haiti
  "IR", // Iran
  "IQ", // Iraq
  "KE", // Kenya
  "KW", // Kuwait
  "LA", // Laos
  "LB", // Lebanon
  "LY", // Libya
  "ML", // Mali
  "MC", // Monaco
  "MM", // Myanmar
  "NA", // Namibia
  "NP", // Nepal
  "NI", // Nicaragua
  "NE", // Niger
  "KP", // North Korea
  "PG", // Papua New Guinea
  "RU", // Russia
  "SO", // Somalia
  "SS", // South Sudan
  "SD", // Sudan
  "SY", // Syria
  "TN", // Tunisia
  "TR", // Türkiye
  "US", // United States of America
  "VE", // Venezuela
  "VN", // Vietnam
  "YE", // Yemen
  "ZW", // Zimbabwe
]);

export const GEO_BYPASS_COOKIE = "geo_bypass";
export const GEO_DB_FILE = path.join(process.cwd(), "geo", "dbip-country-lite.mmdb.gz");

let reader: Reader<CountryResponse> | null | undefined;

function getReader() {
  if (reader !== undefined) return reader;
  try {
    reader = new Reader<CountryResponse>(gunzipSync(fs.readFileSync(GEO_DB_FILE)));
  } catch (e) {
    // Без базы не блокируем никого (иначе закрыли бы сервис всем), но кричим в лог.
    console.error(`[geo] база ${GEO_DB_FILE} не загружена — геоблокировка выключена:`, (e as Error).message);
    reader = null;
  }
  return reader;
}

export function geoBlockEnabled() {
  return process.env.GEO_BLOCK !== "off";
}

/**
 * IP клиента определяется так:
 * 1. «Сосед» — тот, кто подключился к прокси перед сайтом (Traefik): первый из CLIENT_IP_HEADERS
 *    (по умолчанию X-Real-IP — прокси его перезаписывает, подделать нельзя).
 * 2. Если сосед — Cloudflare, настоящий клиент — в CF-Connecting-IP. Иначе (зашли напрямую по IP
 *    сервера, www без Cloudflare) CF-Connecting-IP — от клиента, ему не верим.
 * proxy.ts считает IP один раз и кладёт в CLIENT_IP_HEADER; дальше (Better Auth, действия, шлюз) — оттуда.
 */
export const CLIENT_IP_HEADERS = (process.env.CLIENT_IP_HEADERS ?? "x-real-ip,x-forwarded-for")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter((h) => h && h !== "cf-connecting-ip");

/** Заголовок, который ставит proxy.ts (входящий с тем же именем перезаписывается). */
export const CLIENT_IP_HEADER = "x-harvanera-client-ip";

/** Диапазоны Cloudflare — https://www.cloudflare.com/ips/ (сверено 2026-10-29). */
const CLOUDFLARE = new BlockList();
for (const cidr of [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18",
  "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17",
  "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32",
  "2a06:98c0::/29", "2c0f:f248::/32",
]) {
  const [addr, bits] = cidr.split("/");
  CLOUDFLARE.addSubnet(addr, Number(bits), isIPv6(addr) ? "ipv6" : "ipv4");
}

function normalizeIp(raw: string | null | undefined) {
  const ip = raw?.split(",")[0]?.trim().replace(/^::ffff:(?=\d+\.)/i, "");
  return ip && isIP(ip) ? ip : null;
}

export function isCloudflareIp(ip: string) {
  return CLOUDFLARE.check(ip, isIPv6(ip) ? "ipv6" : "ipv4");
}

/** IP клиента из заголовков прокси (см. выше). Вызывается в proxy.ts. */
export function resolveClientIp(headers: Headers) {
  let peer: string | null = null;
  for (const name of CLIENT_IP_HEADERS) {
    peer = normalizeIp(headers.get(name));
    if (peer) break;
  }
  if (peer && isCloudflareIp(peer)) return normalizeIp(headers.get("cf-connecting-ip")) ?? peer;
  return peer;
}

/** IP клиента: посчитанный в proxy.ts, иначе — заново из заголовков. */
export function clientIp(headers: Headers) {
  return normalizeIp(headers.get(CLIENT_IP_HEADER)) ?? resolveClientIp(headers);
}

export function countryOf(ip: string | null) {
  if (!ip) return null;
  try {
    return getReader()?.get(ip)?.country?.iso_code ?? null;
  } catch {
    return null;
  }
}

/** Секретная cookie команды: пропускает через блокировку (для своих из закрытых стран). */
export function hasBypass(cookieValue: string | undefined) {
  const token = process.env.GEO_BYPASS_TOKEN;
  if (!token || !cookieValue) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** `ip` — из resolveClientIp (в proxy.ts входящему CLIENT_IP_HEADER верить нельзя). */
export function isBlocked(ip: string | null, bypassCookie: string | undefined) {
  if (!geoBlockEnabled() || hasBypass(bypassCookie)) return false;
  const country = countryOf(ip);
  return country != null && BLOCKED_COUNTRIES.has(country);
}
