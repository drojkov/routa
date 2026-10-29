"use client";

import { ArrowRight, Building2, CreditCard, Loader2, MailCheck, Smartphone } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { MerchantInfo } from "@/components/site/merchant-info";
import { TopUpAmount } from "@/components/site/topup-amount";
import { fmtNodes } from "@/i18n/fmt";
import { useI18n } from "@/i18n/provider";
import { createTopUp, requestRefund, resendVerification } from "@/lib/actions/dashboard";
import { MAX_TOPUP_USD, MIN_TOPUP_USD, parseTopUpUsd } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { PageTitle, Panel } from "./ui";

type Entry = { id: string; kind: "bonus" | "topup" | "debit" | "refund" | "adjust"; usd: number; at: number; note: string | null };
type Order = { id: string; status: "pending" | "paid" | "failed" | "canceled"; usd: number; at: number; currency: string; amountMinor: number };
type Refund = { id: string; usd: number; status: "pending" | "approved" | "rejected"; at: number };

export function Billing({
  ledger,
  orders,
  refunds,
  refundableUsd,
  email,
  emailVerified,
  justVerified,
  initialTopUpUsd,
  initialMethod,
}: {
  ledger: Entry[];
  orders: Order[];
  refunds: Refund[];
  refundableUsd: number;
  email: string;
  emailVerified: boolean;
  justVerified?: boolean;
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
          {!emailVerified && <VerifyEmail email={email} />}
          {emailVerified && justVerified && (
            <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <MailCheck className="size-4" /> {b.verify.verified}
            </p>
          )}
          <TopUp initialUsd={initialTopUpUsd} initialMethod={initialMethod} />
          <Orders orders={orders} />
        </div>
        <div className="space-y-4 lg:col-span-3">
          <RefundPanel refundableUsd={refundableUsd} refunds={refunds} />
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

/* ——— Подтверждение email: без него пополнение закрыто (защита от card testing) ——— */
function VerifyEmail({ email }: { email: string }) {
  const { dict, t, locale } = useI18n();
  const v = dict.cab.billing.verify;
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-medium">{v.title}</p>
      <p className="mt-1 text-xs">{t(v.text, { email })}</p>
      {state === "sent" ? (
        <p className="mt-3 text-xs font-medium">{v.sent}</p>
      ) : (
        <button
          type="button"
          disabled={state === "sending"}
          onClick={async () => {
            setState("sending");
            await resendVerification(locale);
            setState("sent");
          }}
          className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 text-xs font-medium hover:bg-amber-100 disabled:opacity-70"
        >
          {state === "sending" && <Loader2 className="size-3.5 animate-spin" />}
          {state === "sending" ? v.sending : v.resend}
        </button>
      )}
    </div>
  );
}

/* ——— Пополнение: любая сумма в USD до цента ——— */
export function TopUp({ initialUsd, initialMethod }: { initialUsd?: number; initialMethod?: string }) {
  const { dict, href, money, currency, locale, t } = useI18n();
  const p = dict.pricing;
  const tp = dict.dashboard.topup;
  const [amount, setAmount] = React.useState(String(initialUsd ?? 25));
  const usd = parseTopUpUsd(amount);
  const [method, setMethod] = React.useState(initialMethod ?? "card");
  const [waiver, setWaiver] = React.useState(false);
  const [details, setDetails] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  const methods = [
    { k: "card", t: p.card, i: CreditCard },
    { k: "wallet", t: p.wallet, i: Smartphone },
    { k: "invoice", t: p.invoice, i: Building2 },
  ];
  const active = methods.some((m) => m.k === method) ? method : "card";
  const errorAmount = t(tp.errorAmount, { min: money(MIN_TOPUP_USD), max: money(MAX_TOPUP_USD) });
  const errors = { amount: errorAmount, waiver: tp.errorWaiver, unverified: tp.errorUnverified, too_many: tp.errorTooMany, details: tp.errorDetails };

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (usd === null) return setError(errorAmount);
    if (active === "invoice" && details.trim().length < 10) return setError(tp.errorDetails);
    if (!waiver) return setError(tp.errorWaiver);
    setError(null);
    start(async () => {
      const res = await createTopUp({ usd, currency, waiver, lang: locale, method: active, billingDetails: details });
      if (res && !res.ok) setError(errors[res.error]);
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
        <TopUpAmount
          value={amount}
          onChange={(v) => {
            setAmount(v);
            setError(null);
          }}
          label={tp.amount}
          presetsLabel={tp.presets}
          invalid={amount !== "" && usd === null}
        />

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

        {active === "invoice" && (
          <label className="mt-4 block">
            <span className="text-xs text-muted-foreground">{tp.details}</span>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={2000}
              className="mt-1.5 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </label>
        )}

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
        {currency !== "USD" && <p className="mt-1 text-center text-[11px] text-muted-foreground/80">{p.chargedIn}</p>}
        <MerchantInfo compact className="mt-3 border-t border-border pt-3" />
      </form>
    </Panel>
  );
}

/* ——— Возврат неиспользованного оплаченного баланса (Refund Policy §2) ——— */
function RefundPanel({ refundableUsd, refunds }: { refundableUsd: number; refunds: Refund[] }) {
  const { dict, money, t, href, date } = useI18n();
  const r = dict.cab.billing.refund;
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = React.useTransition();
  const inReview = refunds.some((x) => x.status === "pending");
  const tone = { pending: "bg-amber-100 text-amber-800", approved: "bg-emerald-100 text-emerald-800", rejected: "bg-muted text-muted-foreground" };

  function submit() {
    if (!window.confirm(t(r.confirm, { amount: money(refundableUsd) }))) return;
    start(async () => {
      const res = await requestRefund({ reason });
      if (res.ok) {
        setMsg({ ok: true, text: r.done });
        setOpen(false);
        setReason("");
      } else setMsg({ ok: false, text: res.error === "pending" ? r.errorPending : r.errorNothing });
    });
  }

  return (
    <Panel
      title={r.title}
      action={
        <Link href={href("/legal/refunds")} target="_blank" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
          {r.policy}
        </Link>
      }
    >
      <p className="text-sm text-muted-foreground">{r.text}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{r.available}</p>
          <p className="text-xl font-semibold tabular-nums">{money(refundableUsd)}</p>
        </div>
        {!open && refundableUsd >= 0.01 && !inReview && (
          <button
            type="button"
            onClick={() => {
              setMsg(null);
              setOpen(true);
            }}
            className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium hover:bg-muted"
          >
            {r.button}
          </button>
        )}
      </div>
      {refundableUsd < 0.01 && !inReview && !msg && <p className="mt-2 text-xs text-muted-foreground">{r.none}</p>}
      {inReview && !msg && <p className="mt-2 text-xs text-muted-foreground">{r.errorPending}</p>}
      {open && (
        <div className="mt-3 space-y-2">
          <label className="block text-xs text-muted-foreground">
            {r.reason}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
              rows={2}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-3 focus:ring-brand/20"
            />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={submit}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background disabled:opacity-70"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? r.sending : r.button}
          </button>
        </div>
      )}
      {msg && (
        <p role="status" className={cn("mt-3 rounded-lg px-3 py-2 text-xs", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>
          {msg.text}
        </p>
      )}
      {refunds.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">{r.requests}</p>
          <ul className="mt-1 divide-y divide-border text-sm">
            {refunds.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 py-2">
                <span className="tabular-nums">
                  {money(x.usd)} <span className="ml-1 text-xs text-muted-foreground">{date(x.at, { day: "numeric", month: "short" })}</span>
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tone[x.status])}>{r.status[x.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
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

