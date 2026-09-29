import "server-only";

/**
 * Лимиты клиентских ключей (SPEC §4). Счётчики в памяти процесса — для нескольких
 * инстансов переносятся в Redis.
 *
 * - RPM на ключ.
 * - Пауза после серии ошибок: 20 ответов 4xx за минуту → пауза 1 мин → 10 мин → 1 ч → 12 ч.
 *   Так мусорный трафик клиента не доходит до хостеров и не ставит под удар наши ключи.
 */
export const RPM_LIMIT = Number(process.env.GATEWAY_RPM ?? 60);
const ERROR_THRESHOLD = 20;
const PAUSES_MS = [60_000, 600_000, 3_600_000, 43_200_000];
/** Сутки без пауз — эскалация сбрасывается. */
const PAUSE_RESET_MS = 86_400_000;

type Window = { start: number; count: number };
type KeyLimits = { rpm: Window; errors: Window; pausedUntil: number; level: number; lastPause: number };

const g = globalThis as unknown as { __gatewayLimits?: Map<string, KeyLimits> };
const keys = (g.__gatewayLimits ??= new Map());

function get(keyId: string): KeyLimits {
  let k = keys.get(keyId);
  if (!k) keys.set(keyId, (k = { rpm: { start: 0, count: 0 }, errors: { start: 0, count: 0 }, pausedUntil: 0, level: 0, lastPause: 0 }));
  return k;
}

function hit(w: Window, now: number) {
  if (now - w.start >= 60_000) {
    w.start = now;
    w.count = 0;
  }
  return ++w.count;
}

/** Проверка перед запросом. Возвращает, сколько секунд ждать, если нельзя. */
export function admit(keyId: string): { ok: true } | { ok: false; code: "key_paused" | "rate_limited"; retryAfter: number } {
  const now = Date.now();
  const k = get(keyId);
  if (k.pausedUntil > now) return { ok: false, code: "key_paused", retryAfter: (k.pausedUntil - now) / 1000 };
  if (hit(k.rpm, now) > RPM_LIMIT) return { ok: false, code: "rate_limited", retryAfter: (k.rpm.start + 60_000 - now) / 1000 };
  return { ok: true };
}

/** Учёт ответа клиенту: 4xx копятся, на пороге ключ встаёт на паузу. */
export function record(keyId: string, status: number) {
  if (status < 400 || status >= 500) return;
  const now = Date.now();
  const k = get(keyId);
  if (hit(k.errors, now) < ERROR_THRESHOLD) return;
  if (now - k.lastPause > PAUSE_RESET_MS) k.level = 0;
  const ms = PAUSES_MS[Math.min(k.level, PAUSES_MS.length - 1)];
  k.pausedUntil = now + ms;
  k.level++;
  k.lastPause = now;
  k.errors = { start: now, count: 0 };
  console.warn(`[gateway] key ${keyId} paused for ${ms / 1000}s after ${ERROR_THRESHOLD} errors/min`);
}
