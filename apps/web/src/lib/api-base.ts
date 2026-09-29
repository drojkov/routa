import "server-only";
import { headers } from "next/headers";
import { API_BASE } from "@/lib/site";

/**
 * Адрес шлюза для примеров кода. API_BASE_URL — явный публичный адрес (в проде);
 * иначе — адрес, с которого открыт сайт (+ /v1), чтобы скопированный пример работал и локально.
 */
export async function apiBase() {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return API_BASE;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}/v1`;
}
