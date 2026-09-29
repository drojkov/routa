import "server-only";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/en";

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./dictionaries/en").then((m) => m.en),
  es: () => import("./dictionaries/es").then((m) => m.es),
  pt: () => import("./dictionaries/pt").then((m) => m.pt),
  de: () => import("./dictionaries/de").then((m) => m.de),
  fr: () => import("./dictionaries/fr").then((m) => m.fr),
  zh: () => import("./dictionaries/zh").then((m) => m.zh),
  ja: () => import("./dictionaries/ja").then((m) => m.ja),
};

export const getDictionary = (locale: Locale) => loaders[locale]();
