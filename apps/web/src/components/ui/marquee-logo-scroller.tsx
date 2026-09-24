"use client";

/**
 * Реконструкция компонента 21st.dev «marquee-logo-scroller» (ravikatiyar162) по его публичному API
 * из промпта «с кем мы работает.txt». Оригинал ставится только с API-ключом 21st.dev:
 *   npx shadcn@latest add "https://21st.dev/r/ravikatiyar162/marquee-logo-scroller?api_key=$API_KEY_21ST"
 * Эта версия сохраняет пропсы 1:1, так что замена не потребует правок в страницах.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export type MarqueeLogo = {
  src: string;
  alt: string;
  gradient: { from: string; via: string; to: string };
};

type Props = {
  title: string;
  description?: string;
  logos: MarqueeLogo[];
  speed?: "slow" | "normal" | "fast";
  className?: string;
};

const DURATION = { slow: "60s", normal: "38s", fast: "22s" } as const;

export function MarqueeLogoScroller({ title, description, logos, speed = "normal", className }: Props) {
  const row = [...logos, ...logos];
  return (
    <section
      className={cn(
        "shadow-soft w-full overflow-hidden rounded-[28px] border border-border bg-card",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border p-6 md:flex-row md:items-end md:justify-between md:p-8">
        <h2 className="max-w-md text-2xl font-semibold tracking-tight text-balance md:text-3xl">{title}</h2>
        {description && (
          <p className="max-w-md text-sm text-pretty text-muted-foreground md:text-right">{description}</p>
        )}
      </div>

      <div className="pause-on-hover mask-fade-x relative py-8">
        <ul
          className="animate-marquee flex w-max gap-4 px-2"
          style={{ "--marquee-duration": DURATION[speed] } as React.CSSProperties}
        >
          {row.map((logo, i) => (
            <li key={`${logo.alt}-${i}`} aria-hidden={i >= logos.length}>
              <LogoTile logo={logo} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function LogoTile({ logo }: { logo: MarqueeLogo }) {
  const { from, via, to } = logo.gradient;
  return (
    <div className="group relative flex h-24 w-44 items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border bg-background transition-transform duration-300 hover:-translate-y-1">
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `linear-gradient(135deg, ${from}, ${via} 55%, ${to})` }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.src}
        alt={logo.alt}
        className="relative size-7 opacity-70 grayscale transition duration-300 group-hover:opacity-100 group-hover:brightness-0 group-hover:invert group-hover:grayscale-0"
        loading="lazy"
      />
      <span className="relative text-sm font-medium text-muted-foreground transition-colors duration-300 group-hover:text-white">
        {logo.alt}
      </span>
    </div>
  );
}

export default MarqueeLogoScroller;
