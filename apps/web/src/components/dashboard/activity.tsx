"use client";

import { AlertTriangle, BarChart3, CheckCircle2, ChevronDown, Coins, Download, FileText, Hash } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useI18n } from "@/i18n/provider";
import { readRequestContent } from "@/lib/actions/dashboard";
import { MODELS } from "@/lib/site";
import { cn } from "@/lib/utils";
import { PageTitle, Panel, Tile } from "./ui";

/**
 * Цвет — за моделью, а не за рангом (dataviz: категориальная палитра в фиксированном порядке).
 * Слоты раздаются доступным моделям по порядку каталога; остальное — «Другое» (серый).
 * Палитра проверена validate_palette.js (light): контраст трёх слотов < 3:1 → рядом таблица по моделям.
 */
const SLOTS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];
const OTHER = "#9a9a92";
const COLOR = new Map(MODELS.filter((m) => m.available).map((m, i) => [m.id, SLOTS[i] ?? OTHER]));
export const modelColor = (id: string) => COLOR.get(id) ?? OTHER;

export type ActivityData = {
  range: 7 | 30 | 90;
  filter: { model?: string; key?: string };
  keys: { id: string; name: string }[];
  summary: { costUsd: number; requests: number; errors: number; inputTokens: number; outputTokens: number };
  days: { day: string; byModel: Record<string, number>; requests: number }[];
  byModel: { model: string; requests: number; inputTokens: number; outputTokens: number; costUsd: number }[];
  rows: {
    id: string;
    at: number;
    model: string;
    source: string | null;
    status: number;
    errorCode: string | null;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    estimated: boolean;
    latencyMs: number | null;
    /** Сохранён текст запроса и ответа (включено логирование). */
    hasContent: boolean;
  }[];
  hasMore: boolean;
};

export function Activity({ data }: { data: ActivityData }) {
  const { dict, money, num } = useI18n();
  const a = dict.cab.activity;
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const setParam = (patch: Record<string, string | undefined>) => {
    const q = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    q.delete("limit");
    router.push(`${pathname}?${q}`, { scroll: false });
  };
  const csv = `/api/account/usage.csv?${new URLSearchParams({ range: String(data.range), ...(data.filter.model ? { model: data.filter.model } : {}), ...(data.filter.key ? { key: data.filter.key } : {}) })}`;

  return (
    <div>
      <PageTitle
        title={a.title}
        sub={a.sub}
        action={
          <a href={csv} download className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-medium transition hover:bg-muted">
            <Download className="size-4" /> {a.exportCsv}
          </a>
        }
      />

      {/* Фильтры — одной строкой над графиками */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-border bg-card p-0.5">
          {([7, 30, 90] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setParam({ range: String(r) })}
              className={cn("rounded-full px-3 py-1 text-sm transition", data.range === r ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
            >
              {a.range[`d${r}`]}
            </button>
          ))}
        </div>
        <select
          value={data.filter.model ?? ""}
          onChange={(e) => setParam({ model: e.target.value || undefined })}
          className="h-9 rounded-full border border-border bg-card px-3 text-sm outline-none"
        >
          <option value="">{a.allModels}</option>
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          value={data.filter.key ?? ""}
          onChange={(e) => setParam({ key: e.target.value || undefined })}
          className="h-9 rounded-full border border-border bg-card px-3 text-sm outline-none"
        >
          <option value="">{a.allKeys}</option>
          <option value="chat">{a.chat}</option>
          {data.keys.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile icon={Coins} label={a.spend} value={money(data.summary.costUsd)} accent />
        <Tile icon={Hash} label={a.requests} value={num(data.summary.requests, 0)} />
        <Tile
          icon={BarChart3}
          label={a.tokens}
          value={compact(data.summary.inputTokens + data.summary.outputTokens)}
          note={`${compact(data.summary.inputTokens)} in · ${compact(data.summary.outputTokens)} out`}
        />
        <Tile icon={AlertTriangle} label={a.errors} value={num(data.summary.errors, 0)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel title={a.byDay} className="lg:col-span-3">
          <SpendChart days={data.days} />
        </Panel>
        <Panel title={a.byModel} className="lg:col-span-2">
          {data.byModel.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{a.empty}</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.byModel.map((m) => {
                  const share = data.summary.costUsd > 0 ? m.costUsd / data.summary.costUsd : 0;
                  return (
                    <tr key={m.model} className="border-b border-border last:border-0">
                      <td className="py-2 pr-2">
                        <span className="flex items-center gap-2">
                          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: modelColor(m.model) }} />
                          <span className="truncate font-mono text-xs">{m.model}</span>
                        </span>
                        <span className="ml-[18px] text-[11px] text-muted-foreground">
                          {num(m.requests, 0)} · {compact(m.inputTokens)} / {compact(m.outputTokens)}
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {money(m.costUsd)}
                        <span className="block text-[11px] text-muted-foreground">{Math.round(share * 100)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <Panel title={a.log} className="mt-4">
        {data.rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{a.empty}</p>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-normal">{a.cols.time}</th>
                  <th className="py-2 font-normal">{a.cols.model}</th>
                  <th className="py-2 font-normal">{a.cols.source}</th>
                  <th className="py-2 text-right font-normal">{a.cols.tokens}</th>
                  <th className="py-2 text-right font-normal">{a.cols.cost}</th>
                  <th className="py-2 text-right font-normal">{a.cols.speed}</th>
                  <th className="py-2 text-right font-normal">{a.cols.status}</th>
                  <th className="pr-5" />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <RequestRow key={r.id} id={r.id} hasContent={r.hasContent}>
                    <td className="px-5 py-2 whitespace-nowrap text-muted-foreground tabular-nums">
                      <DateCell at={r.at} />
                    </td>
                    <td className="py-2 font-mono text-xs">{r.model}</td>
                    <td className="py-2 text-xs">{r.source ?? <span className="text-muted-foreground">{a.chat}</span>}</td>
                    <td className="py-2 text-right text-xs tabular-nums">
                      {num(r.inputTokens, 0)} / {num(r.outputTokens, 0)}
                      {r.estimated && (
                        <span className="ml-1 text-muted-foreground" title={a.estimated}>
                          ≈
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums">{money(r.costUsd)}</td>
                    <td className="py-2 text-right text-xs text-muted-foreground tabular-nums">{r.latencyMs != null ? `${(r.latencyMs / 1000).toFixed(1)} s` : "—"}</td>
                    <td className="py-2 pl-3 text-right text-xs">
                      {r.status < 400 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="size-3.5" /> {a.ok}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700" title={r.errorCode ?? ""}>
                          <AlertTriangle className="size-3.5" /> {r.status} {r.errorCode}
                        </span>
                      )}
                    </td>
                  </RequestRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data.hasMore && (
          <div className="mt-3 text-center">
            <Link
              scroll={false}
              href={`${pathname}?${new URLSearchParams({ ...Object.fromEntries(sp), limit: String(data.rows.length + 50) })}`}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {a.loadMore}
            </Link>
          </div>
        )}
        {data.rows.some((r) => r.estimated) && <p className="mt-3 text-xs text-muted-foreground">≈ {a.estimated}</p>}
      </Panel>
    </div>
  );
}

/** Строка ленты; если текст сохранён — кнопка раскрывает запрос и ответ под строкой. */
function RequestRow({ id, hasContent, children }: { id: string; hasContent: boolean; children: React.ReactNode }) {
  const { dict } = useI18n();
  const c = dict.cab.activity.content;
  const [open, setOpen] = React.useState(false);
  const [content, setContent] = React.useState<{ request: string; response: string } | null | undefined>(undefined);

  const toggle = async () => {
    setOpen(!open);
    if (content === undefined) setContent(await readRequestContent(id));
  };

  return (
    <>
      <tr className={cn("border-b border-border", !open && "last:border-0")} title={id}>
        {children}
        <td className="py-2 pr-5 text-right">
          {hasContent && (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <FileText className="size-3.5" /> {open ? c.hide : c.view}
              <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr className="border-b border-border last:border-0">
          <td colSpan={8} className="bg-muted/40 px-5 py-3">
            {content === undefined ? (
              <p className="text-xs text-muted-foreground">{c.loading}</p>
            ) : content === null ? (
              <p className="text-xs text-muted-foreground">{c.gone}</p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{c.request}</p>
                  <div className="max-h-80 space-y-2 overflow-auto rounded-lg border border-border bg-card p-3 text-xs">
                    {messagesOf(content.request).map((m, i) => (
                      <div key={i}>
                        <span className="font-mono text-[11px] text-muted-foreground">{m.role}</span>
                        <p className="break-words whitespace-pre-wrap">{m.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{c.response}</p>
                  <p className="max-h-80 overflow-auto rounded-lg border border-border bg-card p-3 text-xs break-words whitespace-pre-wrap">{content.response}</p>
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

/** messages из сохранённого JSON → роль и текст (не строковый content — как JSON). */
function messagesOf(json: string): { role: string; text: string }[] {
  try {
    const list = JSON.parse(json) as { role?: string; content?: unknown }[];
    return list.map((m) => ({ role: m.role ?? "?", text: typeof m.content === "string" ? m.content : JSON.stringify(m.content, null, 2) }));
  } catch {
    return [{ role: "raw", text: json }];
  }
}

function DateCell({ at }: { at: number }) {
  const { date } = useI18n();
  return <>{date(at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</>;
}

function compact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/**
 * Расход по дням: столбцы, сложенные по моделям. Одна ось (деньги), тонкие столбцы
 * со скруглённой вершиной, зазор 2px между сегментами, подсказка по наведению.
 */
function SpendChart({ days }: { days: ActivityData["days"] }) {
  const { dict, money, date, t } = useI18n();
  const [hover, setHover] = React.useState<number | null>(null);
  const W = 640;
  const H = 220;
  const pad = { l: 64, r: 8, t: 8, b: 22 };
  const totals = days.map((d) => Object.values(d.byModel).reduce((s, v) => s + v, 0));
  const max = Math.max(...totals, 0);
  const models = [...new Set(days.flatMap((d) => Object.keys(d.byModel)))].sort(
    (x, y) => MODELS.findIndex((m) => m.id === x) - MODELS.findIndex((m) => m.id === y),
  );

  if (max === 0) return <p className="grid h-[220px] place-items-center text-sm text-muted-foreground">{dict.cab.activity.empty}</p>;

  const niceMax = niceCeil(max);
  const ticks = [0, niceMax / 2, niceMax];
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const step = innerW / days.length;
  const barW = Math.max(2, Math.min(18, step * 0.6));
  const y = (v: number) => pad.t + innerH - (v / niceMax) * innerH;
  const labelEvery = Math.ceil(days.length / 7);
  const hovered = hover != null ? days[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={dict.cab.activity.byDay} onMouseLeave={() => setHover(null)}>
        {ticks.map((tv) => (
          <g key={tv}>
            <line x1={pad.l} x2={W - pad.r} y1={y(tv)} y2={y(tv)} stroke="currentColor" className="text-border" strokeWidth={1} />
            <text x={pad.l - 6} y={y(tv) + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
              {money(tv, { compact: tv >= 1 })}
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          const cx = pad.l + step * i + step / 2;
          let acc = 0;
          const segs = models.filter((m) => d.byModel[m] > 0);
          return (
            <g key={d.day}>
              {hover === i && <rect x={cx - step / 2} y={pad.t} width={step} height={innerH} className="fill-muted" />}
              {segs.map((m, si) => {
                const v = d.byModel[m];
                const y0 = y(acc);
                acc += v;
                const y1 = y(acc);
                const top = si === segs.length - 1;
                // 2px зазор между сегментами: каждый сегмент чуть короче снизу.
                const h = Math.max(1, y0 - y1 - (si > 0 ? 2 : 0));
                return top ? (
                  <path key={m} d={roundedTop(cx - barW / 2, y1, barW, h, Math.min(4, barW / 2))} fill={modelColor(m)} />
                ) : (
                  <rect key={m} x={cx - barW / 2} y={y1} width={barW} height={h} fill={modelColor(m)} />
                );
              })}
              {i % labelEvery === 0 && (
                <text x={cx} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                  {date(new Date(d.day + "T00:00:00Z"), { day: "numeric", month: "short", timeZone: "UTC" })}
                </text>
              )}
              {/* зона наведения шире столбца */}
              <rect x={cx - step / 2} y={pad.t} width={step} height={innerH} fill="transparent" onMouseEnter={() => setHover(i)} />
            </g>
          );
        })}
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-xl border border-border bg-card p-2.5 text-xs shadow-float"
          style={{ left: `${Math.min(70, ((hover! + 0.5) / days.length) * 100)}%` }}
        >
          <p className="font-medium">{date(new Date(hovered.day + "T00:00:00Z"), { day: "numeric", month: "long", timeZone: "UTC" })}</p>
          {models
            .filter((m) => hovered.byModel[m] > 0)
            .map((m) => (
              <p key={m} className="mt-1 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-[2px]" style={{ background: modelColor(m) }} />
                  <span className="font-mono">{MODELS.find((x) => x.id === m)?.name ?? m}</span>
                </span>
                <span className="tabular-nums">{money(hovered.byModel[m])}</span>
              </p>
            ))}
          <p className="mt-1.5 flex justify-between border-t border-border pt-1.5 font-medium">
            <span>{t(dict.cab.keys.requests, { n: hovered.requests })}</span>
            <span className="tabular-nums">{money(Object.values(hovered.byModel).reduce((s, v) => s + v, 0))}</span>
          </p>
        </div>
      )}
      {/* легенда — всегда при ≥ 2 сериях */}
      {models.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {models.map((m) => (
            <span key={m} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-[3px]" style={{ background: modelColor(m) }} />
              {MODELS.find((x) => x.id === m)?.name ?? m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function niceCeil(v: number) {
  const e = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / e;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e;
}

function roundedTop(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h);
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}
