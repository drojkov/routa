import "server-only";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";
import { getDictionary } from "./get-dictionary";

/** Для страниц: язык из params → словарь; неизвестный язык — 404. */
export async function loadLocale(params: Promise<{ lang: string }>): Promise<{ lang: Locale; dict: Awaited<ReturnType<typeof getDictionary>> }> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return { lang, dict: await getDictionary(lang) };
}
