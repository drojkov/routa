"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShinyButton } from "@/components/ui/shiny-button";
import { BRAND, NAV } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
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
  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-4xl px-4">
      <nav className="shadow-soft flex items-center gap-2 rounded-2xl border border-border bg-card/85 p-1.5 pl-4 backdrop-blur-xl">
        <Logo />
        <ul className="mx-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = item.href === "/" ? path === "/" : path.startsWith(item.href) && !item.href.includes("#");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative block rounded-lg px-3 py-1.5 text-sm transition-colors",
                    active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                  {active && <span className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-foreground" />}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href="/sign-in"
          className="ml-auto hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:block md:ml-0"
        >
          Войти
        </Link>
        <ShinyButton
          onClick={() => router.push("/sign-in")}
          style={{ "--primary": "var(--brand-strong)" } as React.CSSProperties}
          className="ml-auto border-brand/40 bg-brand/10 px-4 py-2 sm:ml-0 [&>span:first-child]:text-[13px] [&>span:first-child]:tracking-normal [&>span:first-child]:text-brand-strong [&>span:first-child]:normal-case"
        >
          Получить ключ
        </ShinyButton>
      </nav>
    </header>
  );
}
