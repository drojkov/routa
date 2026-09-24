"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { CURRENCIES, LOCALE_COOKIE, LOCALE_NAMES, LOCALES, type Locale, setClientCookie } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const CURRENCY_SIGN: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  RUB: "₽",
  CNY: "¥",
  JPY: "¥",
  INR: "₹",
  BRL: "R$",
};

/** Язык + валюта в одном поповере. `dark` — для тёмного футера и страницы входа. */
export function LocaleSwitcher({
  className,
  dark,
  up,
  align = "right",
}: {
  className?: string;
  dark?: boolean;
  /** Открывать вверх (футер внизу страницы). */
  up?: boolean;
  align?: "left" | "right";
}) {
  const { locale, dict, currency, setCurrency } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchLocale(next: Locale) {
    setClientCookie(LOCALE_COOKIE, next);
    const parts = pathname.split("/");
    parts[1] = next;
    setOpen(false);
    router.push(parts.join("/") + window.location.hash);
  }

  const item = (active: boolean) =>
    cn(
      "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition",
      dark ? "hover:bg-white/10" : "hover:bg-muted",
      active && "font-medium",
    );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${dict.nav.language} / ${dict.nav.currency}`}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
          dark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Globe className="size-4" />
        <span className="uppercase">{locale}</span>
        <span className="opacity-50">·</span>
        <span>{CURRENCY_SIGN[currency]}</span>
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="dialog"
          className={cn(
            "absolute z-[60] mt-2 grid w-[min(92vw,380px)] grid-cols-2 gap-3 rounded-2xl border p-3 shadow-float",
            align === "right" ? "right-0" : "left-0",
            up ? "bottom-full mb-2" : "top-full",
            dark ? "border-white/10 bg-[#1a1a1a] text-white" : "border-border bg-card",
          )}
        >
          <div>
            <p className={cn("px-2.5 pb-1.5 text-[11px] font-medium tracking-wider uppercase", dark ? "text-white/40" : "text-muted-foreground")}>
              {dict.nav.language}
            </p>
            <ul>
              {LOCALES.map((l) => (
                <li key={l}>
                  <button type="button" lang={l} onClick={() => switchLocale(l)} className={item(l === locale)}>
                    {LOCALE_NAMES[l]}
                    {l === locale && <Check className="size-3.5" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={cn("px-2.5 pb-1.5 text-[11px] font-medium tracking-wider uppercase", dark ? "text-white/40" : "text-muted-foreground")}>
              {dict.nav.currency}
            </p>
            <ul>
              {CURRENCIES.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrency(c);
                      setOpen(false);
                    }}
                    className={item(c === currency)}
                  >
                    <span>
                      <span className="inline-block w-7 opacity-60">{CURRENCY_SIGN[c]}</span>
                      {c}
                    </span>
                    {c === currency && <Check className="size-3.5" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
