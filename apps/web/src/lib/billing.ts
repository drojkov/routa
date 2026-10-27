import { MIN_TOPUP_USD } from "@/i18n/config";

/** Бонус на тест при регистрации, USD. */
export const SIGNUP_BONUS_USD = 1;
export { MIN_TOPUP_USD };
/**
 * Пополнение — только фиксированными пакетами, без произвольной суммы: так требует эквайер
 * (риск transaction laundering). Первый пакет = MIN_TOPUP_USD.
 */
export const TOPUP_PACKAGES_USD = [10, 25, 50, 100, 250, 500] as const;
export const MAX_TOPUP_USD = TOPUP_PACKAGES_USD[TOPUP_PACKAGES_USD.length - 1];
export const isTopUpPackage = (usd: number) => (TOPUP_PACKAGES_USD as readonly number[]).includes(usd);
/** Ближайший пакет не меньше суммы (для ?topup= со старых ссылок). */
export const nearestPackage = (usd: number) => TOPUP_PACKAGES_USD.find((p) => p >= usd) ?? MAX_TOPUP_USD;

/** Антифрод заказов: не больше N неоплаченных заказов в час и M заказов за 10 минут. */
export const ORDER_LIMITS = { pendingPerHour: 5, perTenMinutes: 3 };

export const toMicros = (usd: number) => Math.round(usd * 1_000_000);
export const fromMicros = (micros: number) => micros / 1_000_000;

export const KEY_PREFIX = "sk-harvanera-";
