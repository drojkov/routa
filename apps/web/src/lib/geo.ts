import { timingSafeEqual } from "node:crypto";
import fs from "node:fs";
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
 * Заголовки с IP клиента, по порядку. Railway кладёт IP в X-Real-IP (по умолчанию).
 * За Cloudflare на своём сервере — CLIENT_IP_HEADERS=cf-connecting-ip,x-real-ip,x-forwarded-for.
 * Первым ставить только заголовок, который прокси перед сайтом всегда перезаписывает, иначе IP подделывается.
 */
export const CLIENT_IP_HEADERS = (process.env.CLIENT_IP_HEADERS ?? "x-real-ip,x-forwarded-for")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

/** IP клиента по CLIENT_IP_HEADERS; из списка через запятую (X-Forwarded-For) — первый адрес. */
export function clientIp(headers: Headers) {
  for (const name of CLIENT_IP_HEADERS) {
    const ip = headers.get(name)?.split(",")[0]?.trim();
    if (ip) return ip;
  }
  return null;
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

export function isBlocked(headers: Headers, bypassCookie: string | undefined) {
  if (!geoBlockEnabled() || hasBypass(bypassCookie)) return false;
  const country = countryOf(clientIp(headers));
  return country != null && BLOCKED_COUNTRIES.has(country);
}
