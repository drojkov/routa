"use client";

import Link from "next/link";
import { OPEN_COOKIE_SETTINGS } from "@/components/site/cookie-banner";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

const LEGAL_LINKS = ["terms", "privacy", "cookies", "refunds", "acceptable-use"] as const;

/** Короткий подвал для страниц без общего футера (вход, регистрация, /unavailable): юр. документы и настройки cookie. */
export function LegalMiniFooter({ dark, className }: { dark?: boolean; className?: string }) {
  const { dict, href } = useI18n();
  const link = dark ? "hover:text-white" : "hover:text-foreground";
  return (
    <footer className={cn("w-full px-4 text-xs", dark ? "text-white/45" : "text-muted-foreground", className)}>
      <ul className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-4 gap-y-1">
        {LEGAL_LINKS.map((k) => (
          <li key={k}>
            <Link href={href(`/legal/${k}`)} className={link}>
              {dict.legalNames[k]}
            </Link>
          </li>
        ))}
        <li>
          <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))} className={link}>
            {dict.footer.cookieSettings}
          </button>
        </li>
      </ul>
    </footer>
  );
}
