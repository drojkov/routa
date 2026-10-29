"use client";

import { BookOpen, LogOut, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { OPEN_COOKIE_SETTINGS } from "@/components/site/cookie-banner";
import { MerchantInfo } from "@/components/site/merchant-info";
import { Logo } from "@/components/site/nav";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const TABS = [
  { path: "", key: "overview" },
  { path: "/chat", key: "chat" },
  { path: "/keys", key: "keys" },
  { path: "/activity", key: "activity" },
  { path: "/billing", key: "billing" },
  { path: "/settings", key: "settings" },
] as const;

const LEGAL_LINKS = ["terms", "privacy", "cookies", "refunds", "acceptable-use"] as const;

/** Каркас кабинета: шапка с балансом и вкладки разделов. */
export function CabinetShell({ email, balanceUsd, children }: { email: string; balanceUsd: number; children: React.ReactNode }) {
  const { dict, href, money } = useI18n();
  const c = dict.cab;
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const base = href("/dashboard");
  const isActive = (p: string) => (p === "" ? pathname === base : pathname.startsWith(base + p));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
          <Logo />
          <div className="ml-auto flex items-center gap-1">
            <Link
              href={href("/dashboard/billing")}
              title={c.topUp}
              className="group flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-1 pl-3 text-sm transition hover:border-brand/40"
            >
              <span className="text-muted-foreground">{c.balance}</span>
              <span className="font-semibold tabular-nums">{money(balanceUsd)}</span>
              <span className="grid size-6 place-items-center rounded-full bg-foreground text-background transition group-hover:bg-brand">
                <Plus className="size-3.5" />
              </span>
            </Link>
            <Link
              href={href("/docs")}
              className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground sm:flex"
            >
              <BookOpen className="size-4" /> {c.nav.docs}
            </Link>
            <LocaleSwitcher />
            <span className="hidden max-w-44 truncate px-2 text-sm text-muted-foreground lg:inline" title={email}>
              {email}
            </span>
            <button
              type="button"
              disabled={busy}
              title={dict.dashboard.signOut}
              onClick={async () => {
                setBusy(true);
                await authClient.signOut();
                router.push(href("/"));
                router.refresh();
              }}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={base + t.path}
              className={cn(
                "relative shrink-0 px-3 py-2.5 text-sm transition",
                isActive(t.path) ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c.nav[t.key]}
              {isActive(t.path) && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-16">{children}</main>
      {/* Реквизиты продавца на каждой странице кабинета — путь к оплате идёт через него. */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:flex-row md:items-start md:justify-between">
          <MerchantInfo />
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {LEGAL_LINKS.map((k) => (
              <li key={k}>
                <Link href={href(`/legal/${k}`)} className="hover:text-foreground">
                  {dict.legalNames[k]}
                </Link>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))} className="hover:text-foreground">
                {dict.footer.cookieSettings}
              </button>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
