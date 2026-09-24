/** Языки и валюты сайта. Общий модуль: импортируется и в proxy, и в клиентских компонентах. */

export const LOCALES = ["en", "ru", "es", "pt", "de", "fr", "zh", "ja"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  es: "Español",
  pt: "Português",
  de: "Deutsch",
  fr: "Français",
  zh: "中文",
  ja: "日本語",
};

/** BCP 47 для Intl и <html lang>. */
export const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-US",
  ru: "ru-RU",
  es: "es-ES",
  pt: "pt-BR",
  de: "de-DE",
  fr: "fr-FR",
  zh: "zh-CN",
  ja: "ja-JP",
};

export const CURRENCIES = ["USD", "EUR", "GBP", "RUB", "CNY", "JPY", "INR", "BRL"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const LOCALE_CURRENCY: Record<Locale, Currency> = {
  en: "USD",
  ru: "RUB",
  es: "EUR",
  pt: "BRL",
  de: "EUR",
  fr: "EUR",
  zh: "CNY",
  ja: "JPY",
};

/**
 * Сколько единиц валюты за 1 USD. Баланс и цены живут в USD, остальное — пересчёт для показа.
 * Курсы условные, до запуска заменить на ежедневную загрузку (ЦБ/ECB/платёжный провайдер).
 */
export const USD_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  RUB: 92,
  CNY: 7.2,
  JPY: 148,
  INR: 84,
  BRL: 5.4,
};

/** Минимальное пополнение в USD. */
export const MIN_TOPUP_USD = 5;

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const CURRENCY_COOKIE = "currency";
export const CONSENT_COOKIE = "cookie_consent";

export const isLocale = (v: string | undefined | null): v is Locale => !!v && (LOCALES as readonly string[]).includes(v);
export const isCurrency = (v: string | undefined | null): v is Currency => !!v && (CURRENCIES as readonly string[]).includes(v);

/** Разбор Accept-Language без зависимостей: берём первый поддерживаемый язык по q. */
export function matchLocale(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const langs = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of langs) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/** Сумма в USD → строка в валюте пользователя. Мелкие суммы — с двумя значащими цифрами. */
export function formatMoney(usd: number, currency: Currency, locale: Locale, opts: { compact?: boolean } = {}) {
  const v = usd * USD_RATES[currency];
  const small = Math.abs(v) > 0 && Math.abs(v) < 1;
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: "currency",
    currency,
    ...(small
      ? { maximumSignificantDigits: 2 }
      : { maximumFractionDigits: opts.compact || currency === "JPY" || v >= 1000 ? 0 : 2 }),
  }).format(v);
}

export function formatNumber(n: number, locale: Locale, maximumFractionDigits = 2) {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], { maximumFractionDigits }).format(n);
}

/** Путь с префиксом языка: localePath("ru", "/models") → "/ru/models", "/#faq" → "/ru#faq". */
export function localePath(locale: Locale, path: string) {
  if (path.startsWith("/#")) return `/${locale}${path.slice(1)}`;
  if (path === "/") return `/${locale}`;
  return `/${locale}${path}`;
}

/** Запись cookie из браузера (язык, валюта, согласие). */
export function setClientCookie(name: string, value: string, maxAgeSec = 31536000) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSec}; samesite=lax`;
}
