"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { ShinyButton } from "@/components/ui/shiny-button";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { BRAND, NAV } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  const { href } = useI18n();
  return (
    <Link href={href("/")} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="relative grid size-7 place-items-center rounded-lg bg-foreground text-background">
        <span className="absolute inset-1 rounded-md bg-gradient-to-br from-brand to-violet-400 opacity-90" />
        <span className="relative text-xs font-bold text-white">{BRAND[0]}</span>
      </span>
      {BRAND}
    </Link>
  );
}

export function Nav() {
  const path = usePathname();
  const router = useRouter();
  const { dict, href, locale } = useI18n();
  const { data: session } = authClient.useSession();
  const home = `/${locale}`;
  const signedIn = !!session;

  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-5xl px-4">
      <nav className="shadow-soft flex items-center gap-1 rounded-2xl border border-border bg-card/85 p-1.5 pl-4 backdrop-blur-xl">
        <Logo />
        <ul className="mx-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const to = href(item.href);
            const active = item.href === "/" ? path === home : !item.href.includes("#") && path.startsWith(to);
            return (
              <li key={item.href}>
                <Link
                  href={to}
                  className={cn(
                    "relative block rounded-lg px-3 py-1.5 text-sm transition-colors",
                    active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {dict.nav[item.key]}
                  {active && <span className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-foreground" />}
                </Link>
              </li>
            );
          })}
        </ul>
        <LocaleSwitcher className="ml-auto lg:ml-0" />
        {!signedIn && (
          <Link
            href={href("/sign-in")}
            className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            {dict.nav.signIn}
          </Link>
        )}
        <ShinyButton
          onClick={() => router.push(href(signedIn ? "/dashboard" : "/sign-up"))}
          style={{ "--primary": "var(--brand-strong)" } as React.CSSProperties}
          className="border-brand/40 bg-brand/10 px-4 py-2 [&>span:first-child]:text-[13px] [&>span:first-child]:tracking-normal [&>span:first-child]:text-brand-strong [&>span:first-child]:normal-case"
        >
          {signedIn ? dict.nav.dashboard : dict.nav.getKey}
        </ShinyButton>
      </nav>
    </header>
  );
}
