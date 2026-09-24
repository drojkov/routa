"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Search } from "lucide-react";
import * as React from "react";
import { MODELS, type Tier } from "@/lib/site";
import { cn } from "@/lib/utils";

const TIERS: ("Все" | Tier)[] = ["Все", "Флагман", "Универсальная", "Быстрая", "Экономичная"];
const SORTS = { popular: "Популярные", cheap: "Дешевле", fast: "Быстрее", smart: "Умнее" } as const;

export function Catalog() {
  const [q, setQ] = React.useState("");
  const [tier, setTier] = React.useState<(typeof TIERS)[number]>("Все");
  const [sort, setSort] = React.useState<keyof typeof SORTS>("popular");
  const [perAnswer, setPerAnswer] = React.useState(false);

  const list = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    const r = MODELS.filter(
      (m) => (tier === "Все" || m.tier === tier) && (!s || `${m.name} ${m.id} ${m.vendor} ${m.tags.join(" ")}`.toLowerCase().includes(s)),
    );
    const by = { popular: () => 0, cheap: (a: (typeof r)[0], b: (typeof r)[0]) => a.typical - b.typical, fast: (a: (typeof r)[0], b: (typeof r)[0]) => b.speed - a.speed, smart: (a: (typeof r)[0], b: (typeof r)[0]) => b.quality - a.quality }[sort];
    return [...r].sort(by);
  }, [q, tier, sort]);

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <div className="shadow-soft flex flex-col gap-3 rounded-2xl border border-border bg-card p-2 md:flex-row md:items-center">
        <label className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск: claude, код, vision…"
            className="h-10 w-full rounded-xl bg-background pr-3 pl-9 text-sm outline-none focus:ring-3 focus:ring-brand/20"
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={cn(
                "rounded-lg px-3 py-2 text-xs transition",
                tier === t ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}
          className="h-10 rounded-xl bg-background px-3 text-xs outline-none"
        >
          {Object.entries(SORTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
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
              {v ? "за ответ" : "за 1M"}
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
                    <h3 className="font-semibold">{m.name}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{m.tier}</span>
                  </div>
                  <CopyId id={m.id} />
                  <p className="mt-2 text-sm text-muted-foreground">{m.tagline}</p>
                </div>
              </div>
              <dl className="relative mt-5 grid grid-cols-4 gap-2 border-t border-border pt-4 text-xs">
                {perAnswer ? (
                  <Stat k="≈ за ответ" v={`${m.typical.toLocaleString("ru-RU")} ₽`} wide />
                ) : (
                  <>
                    <Stat k="Вход / 1M" v={`${m.priceIn} ₽`} />
                    <Stat k="Выход / 1M" v={`${m.priceOut.toLocaleString("ru-RU")} ₽`} />
                  </>
                )}
                <Stat k="Скорость" v={`${m.speed} ток/с`} />
                <Stat k="Контекст" v={m.context} />
              </dl>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {list.length === 0 && <p className="py-16 text-center text-muted-foreground">Ничего не нашли. Попробуйте «код» или «vision».</p>}
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

function CopyId({ id }: { id: string }) {
  const [ok, setOk] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(id);
        setOk(true);
        setTimeout(() => setOk(false), 1400);
      }}
      className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-muted/70 px-1.5 py-0.5 font-mono text-xs text-muted-foreground transition hover:text-foreground"
    >
      {id}
      {ok ? <Check className="size-3 text-brand-strong" /> : <Copy className="size-3" />}
    </button>
  );
}
