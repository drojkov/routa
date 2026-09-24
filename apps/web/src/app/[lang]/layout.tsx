import type { Metadata } from "next";
import { JetBrains_Mono, Onest } from "next/font/google";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CookieBanner } from "@/components/site/cookie-banner";
import { CURRENCY_COOKIE, isCurrency, isLocale, LOCALE_CURRENCY, LOCALE_TAGS, LOCALES } from "@/i18n/config";
import { fmt } from "@/i18n/fmt";
import { getDictionary } from "@/i18n/get-dictionary";
import { I18nProvider } from "@/i18n/provider";
import { BRAND } from "@/lib/site";
import "../globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const title = fmt(dict.meta.title, { brand: BRAND });
  return {
    title: { default: title, template: `%s — ${BRAND}` },
    description: dict.meta.description,
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], `/${l}`])),
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const [dict, jar] = await Promise.all([getDictionary(lang), cookies()]);
  const saved = jar.get(CURRENCY_COOKIE)?.value;
  const currency = isCurrency(saved) ? saved : LOCALE_CURRENCY[lang];

  return (
    <html lang={LOCALE_TAGS[lang]} className={`${onest.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={lang} dict={dict} initialCurrency={currency}>
          {children}
          <CookieBanner />
        </I18nProvider>
      </body>
    </html>
  );
}
