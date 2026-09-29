"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Search } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useI18n } from "@/i18n/provider";
import { MODELS, TIERS, type Tier } from "@/lib/site";
import { cn } from "@/lib/utils";

const FILTERS: ("all" | Tier)[] = ["all", ...TIERS];
const SORTS = ["popular", "cheap", "fast", "smart"] as const;
type Sort = (typeof SORTS)[number];

export function CatalogHeading() {
  const { dict, t, currency } = useI18n();
  return (
    <div id="catalog" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-8">
      <h2 className="text-3xl font-semibold tracking-tight">{dict.modelsPage.catalogTitle}</h2>
      <p className="mt-1 text-muted-foreground">{t(dict.modelsPage.catalogSub, { currency })}</p>
    </div>
  );
}

export function Catalog() {
  const { dict, money, t, href } = useI18n();
  const c = dict.catalog;
  const sortLabel: Record<Sort, string> = { popular: c.sortPopular, cheap: c.sortCheap, fast: c.sortFast, smart: c.sortSmart };
  const [q, setQ] = React.useState("");
  const [tier, setTier] = React.useState<(typeof FILTERS)[number]>("all");
  const [sort, setSort] = React.useState<Sort>("popular");
  const [perAnswer, setPerAnswer] = React.useState(false);

  const list = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    // Ищем и по английским ключам тегов, и по их переводу — подсказка в поле на любом языке сработает.
    const haystack = (m: (typeof MODELS)[0]) =>
      [m.name, m.id, m.vendor, dict.tiers[m.tier], dict.taglines[m.id], ...m.tags, ...m.tags.map((x) => dict.tags[x])].join(" ").toLowerCase();
    const r = MODELS.filter((m) => (tier === "all" || m.tier === tier) && (!s || haystack(m).includes(s)));
    const by = { popular: () => 0, cheap: (a: (typeof r)[0], b: (typeof r)[0]) => a.typical - b.typical, fast: (a: (typeof r)[0], b: (typeof r)[0]) => b.speed - a.speed, smart: (a: (typeof r)[0], b: (typeof r)[0]) => b.quality - a.quality }[sort];
    return [...r].sort(by);
  }, [q, tier, sort, dict]);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <div className="shadow-soft flex flex-col gap-3 rounded-2xl border border-border bg-card p-2 md:flex-row md:items-center">
        <label className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={c.search}
            className="h-10 w-full rounded-xl bg-background pr-3 pl-9 text-sm outline-none focus:ring-3 focus:ring-brand/20"
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTier(f)}
              aria-pressed={tier === f}
              className={cn(
                "rounded-lg px-3 py-2 text-xs transition",
                tier === f ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {dict.tiers[f]}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="h-10 rounded-xl bg-background px-3 text-xs outline-none"
        >
          {SORTS.map((k) => (
            <option key={k} value={k}>
              {sortLabel[k]}
            </option>
          ))}
        </select>
        <div className="flex rounded-xl bg-muted p-1 text-xs">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              onClick={() => setPerAnswer(v)}
              className={cn("rounded-lg px-3 py-1.5 transition", perAnswer === v ? "bg-card font-medium shadow-soft" : "text-muted-foreground")}
            >
              {v ? c.perAnswer : c.per1m}
            </button>
          ))}
        </div>
      </div>

      <motion.ul layout className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {list.map((m) => (
            <motion.li
              layout
              key={m.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="shadow-soft group relative overflow-hidden rounded-3xl border border-border bg-card p-5"
            >
              <div
                className="absolute -top-16 -right-16 size-40 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-70"
                style={{ background: m.gradient[2] }}
              />
              <div className="relative flex items-start gap-4">
                <div
                  className="h-16 w-12 shrink-0 rounded-lg border border-white/70 shadow-soft"
                  style={{ background: `linear-gradient(160deg, ${m.gradient[0]}, ${m.gradient[1]}, ${m.gradient[2]})` }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      <Link href={href(`/models/${m.id}`)} className="after:absolute after:inset-0 hover:underline">
                        {m.name}
                      </Link>
                    </h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{dict.tiers[m.tier]}</span>
                    {!m.available && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">{dict.card.soon}</span>
                    )}
                  </div>
                  <CopyId id={m.id} label={c.copy} />
                  <p className="mt-2 text-sm text-muted-foreground">{dict.taglines[m.id]}</p>
                </div>
              </div>
              <dl className="relative mt-5 grid grid-cols-4 gap-2 border-t border-border pt-4 text-xs">
                {perAnswer ? (
                  <Stat k={c.statPerAnswer} v={money(m.typical)} wide />
                ) : (
                  <>
                    <Stat k={c.in1m} v={money(m.priceIn)} />
                    <Stat k={c.out1m} v={money(m.priceOut)} />
                  </>
                )}
                <Stat k={c.speed} v={t(dict.units.tps, { n: m.speed })} />
                <Stat k={c.context} v={m.context} />
              </dl>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {list.length === 0 && <p className="py-16 text-center text-muted-foreground">{c.empty}</p>}
    </section>
  );
}

function Stat({ k, v, wide }: { k: string; v: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="mt-0.5 font-medium">{v}</dd>
    </div>
  );
}

function CopyId({ id, label }: { id: string; label: string }) {
  const [ok, setOk] = React.useState(false);
  return (
    <button
      aria-label={`${label}: ${id}`}
      onClick={() => {
        navigator.clipboard?.writeText(id);
        setOk(true);
        setTimeout(() => setOk(false), 1400);
      }}
      className="relative z-10 mt-1 inline-flex items-center gap-1.5 rounded-md bg-muted/70 px-1.5 py-0.5 font-mono text-xs text-muted-foreground transition hover:text-foreground"
    >
      {id}
      {ok ? <Check className="size-3 text-brand-strong" /> : <Copy className="size-3" />}
    </button>
  );
}
