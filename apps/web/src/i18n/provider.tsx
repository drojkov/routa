"use client";

import * as React from "react";
import {
  CURRENCY_COOKIE,
  type Currency,
  formatMoney,
  formatNumber,
  type Locale,
  LOCALE_TAGS,
  localePath,
  setClientCookie,
} from "./config";
import type { Dictionary } from "./dictionaries/en";
import { fmt } from "./fmt";

type Ctx = {
  locale: Locale;
  dict: Dictionary;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** USD → строка в выбранной валюте */
  money: (usd: number, opts?: { compact?: boolean }) => string;
  num: (n: number, digits?: number) => string;
  date: (d: Date | number, opts?: Intl.DateTimeFormatOptions) => string;
  href: (path: string) => string;
  t: typeof fmt;
};

const I18nContext = React.createContext<Ctx | null>(null);

export function I18nProvider({
  locale,
  dict,
  initialCurrency,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  initialCurrency: Currency;
  children: React.ReactNode;
}) {
  const [currency, setCurrencyState] = React.useState<Currency>(initialCurrency);

  const value = React.useMemo<Ctx>(
    () => ({
      locale,
      dict,
      currency,
      setCurrency: (c) => {
        // Функциональная cookie по явному выбору пользователя — согласие не требуется.
        setClientCookie(CURRENCY_COOKIE, c);
        setCurrencyState(c);
      },
      money: (usd, opts) => formatMoney(usd, currency, locale, opts),
      num: (n, digits) => formatNumber(n, locale, digits),
      date: (d, opts = { day: "numeric", month: "short", year: "numeric" }) =>
        new Intl.DateTimeFormat(LOCALE_TAGS[locale], opts).format(d),
      href: (path) => localePath(locale, path),
      t: fmt,
    }),
    [locale, dict, currency],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n вне I18nProvider");
  return ctx;
}
