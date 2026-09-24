"use client";

import { motion } from "framer-motion";
import { Brain, Code2, FileStack, Gauge, MessagesSquare, Timer, Wallet, Workflow } from "lucide-react";
import * as React from "react";
import { Reveal } from "@/components/site/reveal";
import { useI18n } from "@/i18n/provider";
import { MODELS, type Model } from "@/lib/site";
import { cn } from "@/lib/utils";

/* Палитра графиков: слоты 1–3 проверенной категориальной палитры (dataviz, light). */
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a"];

type MetricKey = "typical" | "speed" | "quality" | "ttft";
const METRIC_KEYS: MetricKey[] = ["typical", "speed", "quality", "ttft"];
const BETTER: Record<MetricKey, "low" | "high"> = { typical: "low", speed: "high", quality: "high", ttft: "low" };

/** Подписи и форматирование метрик на языке и в валюте пользователя. */
function useMetrics() {
  const { dict, money, num, t } = useI18n();
  const c = dict.compare;
  return {
    typical: { label: c.metricPrice, fmt: (v: number) => money(v) },
    speed: { label: c.metricSpeed, fmt: (v: number) => t(dict.units.tps, { n: v }) },
    quality: { label: c.metricQuality, fmt: (v: number) => `${v} / 100` },
    ttft: { label: c.metricTtft, fmt: (v: number) => t(dict.units.sec, { n: num(v) }) },
  } satisfies Record<MetricKey, { label: string; fmt: (v: number) => string }>;
}

const TASKS = [
  { k: "code", i: Code2, pick: "anthropic/claude-sonnet-4.5" },
  { k: "chat", i: MessagesSquare, pick: "openai/gpt-5-mini" },
  { k: "docs", i: FileStack, pick: "google/gemini-2.5-pro" },
  { k: "cheap", i: Workflow, pick: "deepseek/deepseek-v3.1" },
] as const;

export function Compare() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24">
      <TaskPicker />
      <Kpis />
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Reveal className="lg:col-span-3">
          <MetricBars />
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-2">
          <PriceQuality />
        </Reveal>
      </div>
      <Reveal className="mt-5">
        <LatencyLines />
      </Reveal>
      <Reveal className="mt-5">
        <HeadToHead />
      </Reveal>
    </div>
  );
}

function Card({ title, sub, children, right }: { title: string; sub?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="shadow-soft h-full rounded-[28px] border-[6px] border-card bg-gradient-to-b from-background to-muted/40 p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {sub && <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { k: T; t: string }[] }) {
  return (
    <div className="flex rounded-xl bg-muted p-1 text-xs">
      {options.map((o) => (
        <button
          key={o.k}
          onClick={() => onChange(o.k)}
          className={cn("relative rounded-lg px-3 py-1.5 transition", value === o.k ? "font-medium" : "text-muted-foreground hover:text-foreground")}
        >
          {value === o.k && <motion.span layoutId={`seg-${options[0].k}`} className="absolute inset-0 rounded-lg bg-card shadow-soft" />}
          <span className="relative">{o.t}</span>
        </button>
      ))}
    </div>
  );
}

/* ——— Подбор по задаче (вкладки как в реф. 5) ——— */
function TaskPicker() {
  const { dict, money, t: tr } = useI18n();
  const c = dict.compare;
  const [k, setK] = React.useState<(typeof TASKS)[number]["k"]>("code");
  const task = TASKS.find((t) => t.k === k)!;
  const m = MODELS.find((x) => x.id === task.pick)!;
  return (
    <div className="shadow-soft rounded-[28px] border-[6px] border-card bg-card/60 p-2">
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/70 p-1 md:grid-cols-4">
        {TASKS.map(({ k: key, i: Icon }) => (
          <button
            key={key}
            onClick={() => setK(key)}
            className={cn("relative flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm transition", k === key ? "font-medium" : "text-muted-foreground")}
          >
            {k === key && <motion.span layoutId="task-tab" className="absolute inset-0 rounded-xl bg-card shadow-soft" />}
            <Icon className="relative size-4" />
            <span className="relative">{c.tasks[key].t}</span>
          </button>
        ))}
      </div>
      <motion.div
        key={k}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start gap-5 p-5 md:flex-row md:items-center"
      >
        <div
          className="grid h-24 w-20 shrink-0 place-items-end rounded-xl border border-white/70 p-2 shadow-float"
          style={{ background: `linear-gradient(160deg, ${m.gradient.join(",")})` }}
        >
          <span className="h-2 w-full rounded-sm" style={{ background: m.stripe }} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{c.recommend}</p>
          <p className="text-2xl font-semibold tracking-tight">{m.name}</p>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{c.tasks[task.k].why}</p>
        </div>
        <dl className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">{c.perAnswer}</dt>
            <dd className="font-semibold">{money(m.typical)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{c.speed}</dt>
            <dd className="font-semibold">{tr(dict.units.tps, { n: m.speed })}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{c.quality}</dt>
            <dd className="font-semibold">{m.quality}</dd>
          </div>
        </dl>
      </motion.div>
    </div>
  );
}

/* ——— KPI-плитки ——— */
function Kpis() {
  const { dict, money, num, t } = useI18n();
  const c = dict.compare;
  const cheapest = [...MODELS].sort((a, b) => a.typical - b.typical)[0];
  const fastest = [...MODELS].sort((a, b) => b.speed - a.speed)[0];
  const smartest = [...MODELS].sort((a, b) => b.quality - a.quality)[0];
  const snappiest = [...MODELS].sort((a, b) => a.ttft - b.ttft)[0];
  const tiles = [
    { i: Wallet, k: c.kpiCheapest, m: cheapest, v: t(c.perAnswerSuffix, { amount: money(cheapest.typical) }) },
    { i: Gauge, k: c.kpiFastest, m: fastest, v: t(dict.units.tps, { n: fastest.speed }) },
    { i: Brain, k: c.kpiSmartest, m: smartest, v: `${smartest.quality} / 100` },
    { i: Timer, k: c.kpiTtft, m: snappiest, v: t(dict.units.sec, { n: num(snappiest.ttft) }) },
  ];
  return (
    <div className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-4">
      {tiles.map(({ i: Icon, k, m, v }, n) => (
        <Reveal key={k} delay={n * 0.06}>
          <div className="shadow-soft rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="size-4" /> {k}
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight">{v}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: m.gradient[2] }} /> {m.name}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ——— Столбцы по метрике: одна серия, наведённый столбец подсвечен ——— */
function MetricBars() {
  const { dict } = useI18n();
  const METRICS = useMetrics();
  const [metric, setMetric] = React.useState<MetricKey>("typical");
  const [hover, setHover] = React.useState<string | null>(null);
  const cfg = METRICS[metric];
  const better = BETTER[metric];
  const sorted = [...MODELS].sort((a, b) => (better === "low" ? a[metric] - b[metric] : b[metric] - a[metric]));
  const max = Math.max(...MODELS.map((m) => m[metric]));
  const best = sorted[0].id;
  return (
    <Card
      title={cfg.label}
      sub={better === "low" ? dict.compare.lowerBetter : dict.compare.higherBetter}
      right={
        <Segmented
          value={metric}
          onChange={setMetric}
          options={METRIC_KEYS.map((k) => ({ k, t: METRICS[k].label }))}
        />
      }
    >
      <ul className="space-y-2.5">
        {sorted.map((m) => {
          const on = hover ? hover === m.id : m.id === best;
          return (
            <li key={m.id} onMouseEnter={() => setHover(m.id)} onMouseLeave={() => setHover(null)} className="grid grid-cols-[132px_1fr_84px] items-center gap-3 text-sm">
              <span className={cn("truncate", on ? "font-medium" : "text-muted-foreground")}>{m.name}</span>
              <div className="h-7 rounded-[4px] bg-muted/60">
                <motion.div
                  layout
                  initial={false}
                  animate={{ width: `${(m[metric] / max) * 100}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  className={cn("h-full rounded-r-[4px] transition-colors", on ? "bg-brand" : "bg-foreground/15")}
                />
              </div>
              <span className={cn("text-right tabular-nums", on ? "font-semibold" : "text-muted-foreground")}>{cfg.fmt(m[metric])}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ——— Цена vs качество: точки с прямыми подписями ——— */
function PriceQuality() {
  const { dict, money, t } = useI18n();
  const c = dict.compare;
  const [hover, setHover] = React.useState<Model | null>(null);
  const W = 360;
  const H = 340;
  const pad = { l: 36, r: 16, t: 12, b: 32 };
  const maxP = Math.max(...MODELS.map((m) => m.typical)) * 1.15;
  const ticks = [0, 0.3, 0.6, 0.9].map((f) => f * maxP);
  const x = (v: number) => pad.l + (v / maxP) * (W - pad.l - pad.r);
  const y = (q: number) => pad.t + (1 - (q - 77) / 18) * (H - pad.t - pad.b);
  return (
    <Card title={c.pqTitle} sub={c.pqSub}>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={c.pqAria}>
          {[80, 85, 90, 95].map((q) => (
            <g key={q}>
              <line x1={pad.l} x2={W - pad.r} y1={y(q)} y2={y(q)} className="stroke-border" strokeDasharray="3 4" />
              <text x={pad.l - 8} y={y(q) + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
                {q}
              </text>
            </g>
          ))}
          {ticks.map((p) => (
            <text key={p} x={x(p)} y={H - 10} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {p === 0 ? "0" : money(p)}
            </text>
          ))}
          {MODELS.map((m) => {
            const on = hover?.id === m.id;
            return (
              <g key={m.id} onMouseEnter={() => setHover(m)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
                <circle cx={x(m.typical)} cy={y(m.quality)} r={16} fill="transparent" />
                <circle
                  cx={x(m.typical)}
                  cy={y(m.quality)}
                  r={on ? 8 : 5.5}
                  className={cn("stroke-card transition-all", on ? "fill-brand" : "fill-foreground/70")}
                  strokeWidth={2}
                />
                <text
                  x={x(m.typical) + (m.typical > maxP * 0.7 ? -11 : 11)}
                  y={y(m.quality) + 3.5}
                  textAnchor={m.typical > maxP * 0.7 ? "end" : "start"}
                  className={cn("text-[10px]", on ? "fill-foreground font-semibold" : "fill-muted-foreground")}>
                  {m.name}
                </text>
              </g>
            );
          })}
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute rounded-xl bg-card px-3 py-2 text-xs shadow-float"
            style={{ left: `${(x(hover.typical) / W) * 100}%`, top: `${(y(hover.quality) / H) * 100}%`, transform: "translate(-50%, calc(-100% - 14px))" }}
          >
            <p className="font-semibold">{hover.name}</p>
            <p className="text-muted-foreground">
              {money(hover.typical)} · {t(c.qualityOf, { n: hover.quality })}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

/* ——— Задержка за 14 дней: 3 линии, легенда + перекрестие ——— */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const LINE_MODELS = MODELS.slice(0, 3);
const DAYS = Array.from({ length: 14 }, (_, i) => i + 11);
const LINES = LINE_MODELS.map((m, k) => {
  const r = seeded(k * 17 + 3);
  return DAYS.map((_, i) => +(m.ttft + (r() - 0.5) * 0.35 + (i === 9 && k === 2 ? 0.6 : 0)).toFixed(2));
});

function LatencyLines() {
  const { dict, num, date, t } = useI18n();
  const c = dict.compare;
  const day = (d: number, month: "short" | "long" = "short") => date(new Date(2026, 8, d), { day: "numeric", month });
  const [idx, setIdx] = React.useState<number | null>(null);
  const [hidden, setHidden] = React.useState<Set<number>>(new Set());
  const W = 900;
  const H = 240;
  const pad = { l: 40, r: 16, t: 16, b: 28 };
  const x = (i: number) => pad.l + (i / (DAYS.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / 2.4) * (H - pad.t - pad.b);
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (DAYS.length - 1));
    setIdx(Math.min(DAYS.length - 1, Math.max(0, i)));
  }

  return (
    <Card
      title={c.latencyTitle}
      sub={c.latencySub}
      right={
        <div className="flex flex-wrap gap-2 text-xs">
          {LINE_MODELS.map((m, k) => (
            <button
              key={m.id}
              onClick={() => setHidden((h) => { const n = new Set(h); if (n.has(k)) n.delete(k); else n.add(k); return n; })}
              className={cn("flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 transition", hidden.has(k) && "opacity-40")}
            >
              <span className="h-0.5 w-3 rounded-full" style={{ background: SERIES[k] }} /> {m.name}
            </button>
          ))}
        </div>
      }
    >
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseMove={onMove} onMouseLeave={() => setIdx(null)} role="img" aria-label={c.latencyAria}>
          {[0, 0.8, 1.6, 2.4].map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="stroke-border" />
              <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
                {num(v)}
              </text>
            </g>
          ))}
          {DAYS.map((d, i) =>
            i % 2 === 0 ? (
              <text key={d} x={x(i)} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                {day(d)}
              </text>
            ) : null,
          )}
          {idx !== null && <line x1={x(idx)} x2={x(idx)} y1={pad.t} y2={H - pad.b} className="stroke-foreground/30" />}
          {LINES.map((vals, k) =>
            hidden.has(k) ? null : (
              <g key={k}>
                <motion.path
                  d={path(vals)}
                  fill="none"
                  stroke={SERIES[k]}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: k * 0.15, ease: "easeInOut" }}
                />
                {idx !== null && <circle cx={x(idx)} cy={y(vals[idx])} r={4.5} fill={SERIES[k]} className="stroke-card" strokeWidth={2} />}
              </g>
            ),
          )}
        </svg>
        {idx !== null && (
          <div
            className="pointer-events-none absolute top-2 rounded-xl bg-card px-3 py-2 text-xs shadow-float"
            style={{ left: `${(x(idx) / W) * 100}%`, transform: idx > 9 ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}
          >
            <p className="mb-1 font-medium">{day(DAYS[idx], "long")}</p>
            {LINE_MODELS.map((m, k) =>
              hidden.has(k) ? null : (
                <p key={m.id} className="flex items-center gap-2">
                  <span className="h-0.5 w-3 rounded-full" style={{ background: SERIES[k] }} />
                  <span className="text-muted-foreground">{m.name}</span>
                  <span className="ml-auto pl-3 font-medium tabular-nums">{t(dict.units.sec, { n: num(LINES[k][idx]) })}</span>
                </p>
              ),
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ——— Лицом к лицу: выбор 2 моделей ——— */
function HeadToHead() {
  const { dict, money, num, t } = useI18n();
  const c = dict.compare;
  const sec = (v: number) => t(dict.units.sec, { n: num(v) });
  const tps = (v: number) => t(dict.units.tps, { n: v });
  const [a, setA] = React.useState(MODELS[1].id);
  const [b, setB] = React.useState(MODELS[3].id);
  const A = MODELS.find((m) => m.id === a)!;
  const B = MODELS.find((m) => m.id === b)!;
  const rows: { k: string; va: string; vb: string; win: 0 | 1 | 2 }[] = [
    { k: c.rowPrice, va: money(A.typical), vb: money(B.typical), win: A.typical === B.typical ? 0 : A.typical < B.typical ? 1 : 2 },
    { k: c.rowIn, va: money(A.priceIn), vb: money(B.priceIn), win: A.priceIn === B.priceIn ? 0 : A.priceIn < B.priceIn ? 1 : 2 },
    { k: c.rowOut, va: money(A.priceOut), vb: money(B.priceOut), win: A.priceOut === B.priceOut ? 0 : A.priceOut < B.priceOut ? 1 : 2 },
    { k: c.rowSpeed, va: tps(A.speed), vb: tps(B.speed), win: A.speed === B.speed ? 0 : A.speed > B.speed ? 1 : 2 },
    { k: c.rowTtft, va: sec(A.ttft), vb: sec(B.ttft), win: A.ttft === B.ttft ? 0 : A.ttft < B.ttft ? 1 : 2 },
    { k: c.rowQuality, va: `${A.quality}`, vb: `${B.quality}`, win: A.quality === B.quality ? 0 : A.quality > B.quality ? 1 : 2 },
    { k: c.rowContext, va: A.context, vb: B.context, win: 0 },
  ];
  const sel = "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm font-medium outline-none focus:ring-3 focus:ring-brand/20";
  return (
    <Card title={c.h2hTitle} sub={c.h2hSub}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr>
              <th className="w-1/3" />
              <th className="w-1/3 px-2 pb-3">
                <select value={a} onChange={(e) => setA(e.target.value)} className={sel}>
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </th>
              <th className="w-1/3 px-2 pb-3">
                <select value={b} onChange={(e) => setB(e.target.value)} className={sel}>
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.k} className="border-t border-border">
                <td className="py-3 text-muted-foreground">{r.k}</td>
                {[r.va, r.vb].map((v, i) => (
                  <td key={i} className="px-2 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-lg px-2.5 py-1 tabular-nums transition-colors",
                        r.win === i + 1 ? "bg-brand-soft font-semibold text-brand-strong" : "",
                      )}
                    >
                      {v}
                      {r.win === i + 1 && " ✓"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
