"use client";

import { ArrowRight, Building2, CreditCard, Loader2, Smartphone } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { MIN_TOPUP_USD, USD_RATES } from "@/i18n/config";
import { fmtNodes } from "@/i18n/fmt";
import { useI18n } from "@/i18n/provider";
import { createTopUp } from "@/lib/actions/dashboard";
import { MAX_TOPUP_USD } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { PageTitle, Panel } from "./ui";

type Entry = { id: string; kind: "bonus" | "topup" | "debit" | "refund" | "adjust"; usd: number; at: number; note: string | null };
type Order = { id: string; status: "pending" | "paid" | "failed" | "canceled"; usd: number; at: number; currency: string; amountMinor: number };

export function Billing({
  ledger,
  orders,
  initialTopUpUsd,
  initialMethod,
}: {
  ledger: Entry[];
  orders: Order[];
  initialTopUpUsd?: number;
  initialMethod?: string;
}) {
  const { dict } = useI18n();
  const b = dict.cab.billing;
  return (
    <div>
      <PageTitle title={b.title} sub={b.sub} />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <TopUp initialUsd={initialTopUpUsd} initialMethod={initialMethod} />
          <Orders orders={orders} />
        </div>
        <div className="lg:col-span-3">
          <History ledger={ledger} />
        </div>
      </div>
    </div>
  );
}

function Orders({ orders }: { orders: Order[] }) {
  const { dict, href, date, locale } = useI18n();
  const b = dict.cab.billing;
  const tone = { pending: "bg-amber-100 text-amber-800", paid: "bg-emerald-100 text-emerald-800", failed: "bg-red-100 text-red-700", canceled: "bg-muted text-muted-foreground" };
  return (
    <Panel title={b.orders}>
      {orders.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{b.noOrders}</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="tabular-nums">
                  {new Intl.NumberFormat(locale, { style: "currency", currency: o.currency }).format(o.amountMinor / (o.currency === "JPY" ? 1 : 100))}
                </p>
                <p className="text-xs text-muted-foreground">{date(o.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tone[o.status])}>{b.status[o.status]}</span>
                <Link href={href(`/dashboard/checkout/${o.id}`)} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  {b.open}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ——— Пополнение ——— */
const PRESETS = [10, 25, 100];

export function TopUp({ initialUsd, initialMethod }: { initialUsd?: number; initialMethod?: string }) {
  const { dict, href, money, t, currency, locale } = useI18n();
  const p = dict.pricing;
  const tp = dict.dashboard.topup;
  const rate = USD_RATES[currency];
  const [usd, setUsd] = React.useState(initialUsd ?? 25);
  const [method, setMethod] = React.useState(initialMethod ?? "card");
  const [waiver, setWaiver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  const methods = [
    { k: "card", t: p.card, i: CreditCard },
    { k: "wallet", t: p.wallet, i: Smartphone },
    { k: "invoice", t: p.invoice, i: Building2 },
  ];
  const active = methods.some((m) => m.k === method) ? method : "card";
  const local = Math.round(usd * rate * 100) / 100;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (usd < MIN_TOPUP_USD) return setError(t(tp.errorMin, { amount: money(MIN_TOPUP_USD) }));
    if (usd > MAX_TOPUP_USD) return setError(t(tp.errorMax, { amount: money(MAX_TOPUP_USD) }));
    if (!waiver) return setError(tp.errorWaiver);
    setError(null);
    start(async () => {
      const res = await createTopUp({ amount: local, currency, waiver, lang: locale });
      if (res && !res.ok) setError(res.error === "waiver" ? tp.errorWaiver : t(tp.errorMin, { amount: money(MIN_TOPUP_USD) }));
    });
  }

  const doc = (k: "terms" | "refunds") => (
    <Link key={k} href={href(`/legal/${k}`)} target="_blank" className="underline underline-offset-2 hover:text-foreground">
      {dict.legalNames[k]}
    </Link>
  );

  return (
    <Panel id="topup" title={tp.title}>
      <form onSubmit={onSubmit}>
        <p className="text-4xl font-semibold tracking-tight">{money(usd)}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {PRESETS.map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => setUsd(v)}
              className={cn(
                "rounded-xl border py-2 text-sm font-medium transition",
                Math.abs(usd - v) < 1e-6 ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/30",
              )}
            >
              {money(v, { compact: true })}
            </button>
          ))}
        </div>
        <label className="mt-2 block">
          <span className="sr-only">
            {tp.amount}, {currency}
          </span>
          <div className="relative">
            <input
              type="number"
              min={Math.ceil(MIN_TOPUP_USD * rate)}
              step="any"
              required
              value={local}
              onChange={(e) => setUsd(Number(e.target.value) / rate)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 pr-14 text-sm outline-none focus:border-brand focus:ring-3 focus:ring-brand/20"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">{currency}</span>
          </div>
        </label>

        <p className="mt-4 text-xs text-muted-foreground">{tp.method}</p>
        <div className="mt-1.5 grid grid-cols-3 gap-2 text-xs">
          {methods.map(({ k, t: label, i: Icon }) => (
            <button
              type="button"
              key={k}
              onClick={() => setMethod(k)}
              aria-pressed={active === k}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-center transition",
                active === k ? "border-brand bg-brand-soft/60 text-brand-strong" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs leading-snug text-muted-foreground">
          <input
            type="checkbox"
            checked={waiver}
            onChange={(e) => setWaiver(e.target.checked)}
            className="mt-0.5 size-3.5 shrink-0 accent-[var(--brand)]"
          />
          {tp.waiver}
        </label>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {pending ? tp.creating : tp.continue}
          {!pending && <ArrowRight className="size-4" />}
        </button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">{fmtNodes(tp.terms, { terms: doc("terms"), refunds: doc("refunds") })}</p>
      </form>
    </Panel>
  );
}

/* ——— История баланса ——— */
function History({ ledger }: { ledger: Entry[] }) {
  const { dict, money, date } = useI18n();
  const a = dict.dashboard.activity;
  const b = dict.cab.billing;
  const [kind, setKind] = React.useState<Entry["kind"] | "all">("all");
  const list = kind === "all" ? ledger : ledger.filter((e) => e.kind === kind);
  const kinds = (["all", "topup", "debit", "bonus", "refund"] as const).filter((k) => k === "all" || ledger.some((e) => e.kind === k));
  return (
    <Panel
      title={b.history}
      action={
        <div className="flex flex-wrap gap-1">
          {kinds.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn("rounded-full px-2.5 py-1 text-xs transition", kind === k ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted")}
            >
              {k === "all" ? b.all : a.kinds[k]}
            </button>
          ))}
        </div>
      }
    >
      {list.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{a.empty}</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {list.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p>
                  {a.kinds[e.kind]}
                  {e.kind === "debit" && e.note && <span className="ml-2 font-mono text-xs text-muted-foreground">{e.note}</span>}
                </p>
                <p className="text-xs text-muted-foreground">{date(e.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <span className={cn("font-medium tabular-nums", e.usd >= 0 ? "text-emerald-600" : "text-foreground")}>
                {e.usd >= 0 ? "+" : "−"}
                {money(Math.abs(e.usd))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

