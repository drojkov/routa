import { MIN_TOPUP_USD } from "@/i18n/config";

/** Бонус на тест при регистрации, USD. */
export const SIGNUP_BONUS_USD = 1;
export { MIN_TOPUP_USD };
/**
 * Пополнение — на произвольную сумму в USD с точностью до цента, от MIN_TOPUP_USD до MAX_TOPUP_USD.
 * Пакеты ниже — только быстрые кнопки в форме.
 */
export const MAX_TOPUP_USD = 10_000;
export const TOPUP_PRESETS_USD = [10, 25, 50, 100, 250, 500] as const;
/** Сумма до центов; null — если не число или вне границ. */
export function parseTopUpUsd(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n)) return null;
  const usd = Math.round(n * 100) / 100;
  if (Math.abs(usd - n) > 1e-9) return null;
  return usd >= MIN_TOPUP_USD && usd <= MAX_TOPUP_USD ? usd : null;
}

/** Антифрод заказов: не больше N неоплаченных заказов в час и M заказов за 10 минут. */
export const ORDER_LIMITS = { pendingPerHour: 5, perTenMinutes: 3 };

export const toMicros = (usd: number) => Math.round(usd * 1_000_000);
export const fromMicros = (micros: number) => micros / 1_000_000;

export const KEY_PREFIX = "sk-harvanera-";
