import { MIN_TOPUP_USD } from "@/i18n/config";

/** Бонус на тест при регистрации, USD. */
export const SIGNUP_BONUS_USD = 1;
export { MIN_TOPUP_USD };
export const MAX_TOPUP_USD = 10_000;

export const toMicros = (usd: number) => Math.round(usd * 1_000_000);
export const fromMicros = (micros: number) => micros / 1_000_000;

export const KEY_PREFIX = "sk-harvanera-";
