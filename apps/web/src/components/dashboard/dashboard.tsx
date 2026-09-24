"use client";

import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Copy,
  CreditCard,
  Download,
  KeyRound,
  Loader2,
  LogOut,
  Plus,
  QrCode,
  Smartphone,
  Trash2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { Logo } from "@/components/site/nav";
import { MIN_TOPUP_USD, USD_RATES } from "@/i18n/config";
import { fmtNodes } from "@/i18n/fmt";
import { useI18n } from "@/i18n/provider";
import { createApiKey, createTopUp, revokeApiKey } from "@/lib/actions/dashboard";
import { authClient } from "@/lib/auth-client";
import { MAX_TOPUP_USD } from "@/lib/billing";
import { API_BASE } from "@/lib/site";
import { cn } from "@/lib/utils";

type Key = { id: string; name: string; prefix: string; limitUsd: number | null; createdAt: number; lastUsedAt: number | null; revoked: boolean };
type Entry = { id: string; kind: "bonus" | "topup" | "debit" | "refund" | "adjust"; usd: number; at: number };

export function Dashboard({
  user,
  balanceUsd,
  spentUsd,
  keys,
  ledger,
  initialTopUpUsd,
  initialMethod,
}: {
  user: { name: string; email: string; image: string | null };
  balanceUsd: number;
  spentUsd: number;
  keys: Key[];
  ledger: Entry[];
  initialTopUpUsd?: number;
  initialMethod?: string;
}) {
  const { dict, money, t, currency } = useI18n();
  const d = dict.dashboard;
  const activeKeys = keys.filter((k) => !k.revoked).length;

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-24">
        <h1 className="text-3xl font-semibold tracking-tight">{t(d.hello, { name: user.name.split(" ")[0] })}</h1>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Tile icon={Wallet} label={d.balance} value={money(balanceUsd)} note={t(d.balanceNote, { currency })} accent>
            <a
              href="#topup"
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/90"
            >
              <Plus className="size-4" /> {d.topUp}
            </a>
          </Tile>
          <Tile icon={BarChart3} label={d.spentMonth} value={money(spentUsd)} note={`${d.requestsMonth}: 0`} />
          <Tile icon={KeyRound} label={d.activeKeys} value={String(activeKeys)} note={API_BASE} mono />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <Keys keys={keys} />
            <QuickStart />
            <Panel title={d.usage.title}>
              <p className="py-6 text-center text-sm text-muted-foreground">{d.usage.empty}</p>
            </Panel>
          </div>
          <div className="space-y-4 lg:col-span-2">
            <TopUp initialUsd={initialTopUpUsd} initialMethod={initialMethod} />
            <History ledger={ledger} />
            <Privacy />
          </div>
        </div>
      </main>
    </div>
  );
}

function Header({ user }: { user: { name: string; email: string; image: string | null } }) {
  const { dict, href } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Logo />
        <span className="ml-2 hidden rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline">{dict.dashboard.metaTitle}</span>
        <div className="ml-auto flex items-center gap-1">
          <LocaleSwitcher />
          <span className="hidden max-w-48 truncate px-2 text-sm text-muted-foreground md:inline" title={user.email}>
            {user.email}
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await authClient.signOut();
              router.push(href("/"));
              router.refresh();
            }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            <span className="hidden sm:inline">{dict.dashboard.signOut}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  note,
  accent,
  mono,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("shadow-soft relative overflow-hidden rounded-3xl border border-border bg-card p-5", accent && "border-brand/30")}>
      {accent && <div className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-brand/20 blur-3xl" />}
      <div className="relative">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="size-4" /> {label}
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        {note && <p className={cn("mt-1 truncate text-xs text-muted-foreground", mono && "font-mono")}>{note}</p>}
        {children}
      </div>
    </div>
  );
}

function Panel({ title, action, children, id }: { title: string; action?: React.ReactNode; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="shadow-soft scroll-mt-20 rounded-3xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const { dict } = useI18n();
  const [ok, setOk] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition hover:bg-muted", className)}
    >
      {ok ? <Check className="size-3.5 text-brand-strong" /> : <Copy className="size-3.5" />}
      {ok ? dict.dashboard.keys.copied : dict.dashboard.keys.copy}
    </button>
  );
}

/* ——— API-ключи ——— */
function Keys({ keys }: { keys: Key[] }) {
  const { dict, money, t, date, currency } = useI18n();
  const k = dict.dashboard.keys;
  const [creating, setCreating] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [created, setCreated] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      const res = await createApiKey({ name: String(f.get("name")), limit: String(f.get("limit") ?? ""), currency });
      if (!res.ok) return setError(dict.auth.errors.generic);
      setError(null);
      setCreated(res.key);
      setCreating(false);
      form.reset();
    });
  }

  return (
    <Panel
      title={k.title}
      action={
        !creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-white shadow-[0_8px_20px_-8px_var(--brand)] transition hover:bg-brand-strong"
          >
            <Plus className="size-4" /> {k.create}
          </button>
        )
      }
    >
      {created && (
        <div className="mb-4 rounded-2xl border border-brand/40 bg-brand-soft/50 p-4">
          <p className="text-sm font-medium">{k.createdTitle}</p>
          <p className="text-xs text-muted-foreground">{k.createdNote}</p>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-card p-2 pl-3 shadow-soft">
            <code className="min-w-0 flex-1 truncate font-mono text-xs">{created}</code>
            <CopyButton text={created} />
          </div>
          <button type="button" onClick={() => setCreated(null)} className="mt-3 text-xs text-muted-foreground underline underline-offset-2">
            {k.done}
          </button>
        </div>
      )}

      {creating && (
        <form onSubmit={onCreate} className="mb-4 grid gap-2 rounded-2xl bg-muted/60 p-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="text-xs text-muted-foreground">
            {k.name}
            <input
              name="name"
              required
              maxLength={60}
              autoFocus
              placeholder={k.namePlaceholder}
              className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 font-mono text-sm text-foreground outline-none focus:border-brand focus:ring-3 focus:ring-brand/20"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            {t(k.limit, { currency })}
            <input
              name="limit"
              type="number"
              min={0}
              step="any"
              placeholder="—"
              className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-3 focus:ring-brand/20"
            />
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-foreground px-4 text-sm font-medium text-background disabled:opacity-70"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? k.creating : k.create}
            </button>
            <button type="button" onClick={() => setCreating(false)} className="h-10 rounded-xl px-3 text-sm text-muted-foreground hover:bg-card">
              {dict.common.close}
            </button>
          </div>
          {error && <p className="text-xs text-red-600 sm:col-span-3">{error}</p>}
        </form>
      )}

      {keys.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{k.none}</p>
      ) : (
        <ul className="divide-y divide-border">
          {keys.map((key) => (
            <li key={key.id} className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 py-3", key.revoked && "opacity-50")}>
              <KeyRound className="size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-medium">{key.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{key.prefix}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{key.limitUsd == null ? k.noLimit : t(dict.hero.limit, { amount: money(key.limitUsd) })}</p>
                <p>{key.lastUsedAt ? t(k.lastUsed, { date: date(key.lastUsedAt) }) : t(k.created, { date: date(key.createdAt) })}</p>
              </div>
              {key.revoked ? (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{k.revoked}</span>
              ) : (
                <RevokeButton id={key.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function RevokeButton({ id }: { id: string }) {
  const { dict } = useI18n();
  const [pending, start] = React.useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(dict.dashboard.keys.revokeConfirm)) return;
        start(() => revokeApiKey(id));
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      {dict.dashboard.keys.revoke}
    </button>
  );
}

/* ——— Быстрый старт ——— */
function QuickStart() {
  const { dict } = useI18n();
  const code = `from openai import OpenAI

client = OpenAI(
    base_url="${API_BASE}",
    api_key="sk-routa-…",
)
r = client.chat.completions.create(
    model="deepseek/deepseek-v3.1",
    messages=[{"role": "user", "content": "Hello!"}],
)`;
  return (
    <Panel title={dict.dashboard.quickstartTitle} action={<CopyButton text={code} />}>
      <p className="text-sm text-muted-foreground">{dict.dashboard.quickstartText}</p>
      <pre className="mt-3 overflow-x-auto rounded-2xl bg-[#111] p-4 font-mono text-[12px] leading-relaxed text-white/85">{code}</pre>
    </Panel>
  );
}

/* ——— Пополнение ——— */
const PRESETS = [10, 25, 100];

function TopUp({ initialUsd, initialMethod }: { initialUsd?: number; initialMethod?: string }) {
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
    currency === "RUB" ? { k: "sbp", t: p.sbp, i: QrCode } : { k: "wallet", t: p.wallet, i: Smartphone },
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
  return (
    <Panel title={a.title}>
      {ledger.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{a.empty}</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {ledger.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p>{a.kinds[e.kind]}</p>
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

/* ——— Данные и удаление аккаунта (GDPR ст. 15, 17, 20) ——— */
function Privacy() {
  const { dict, href } = useI18n();
  const s = dict.dashboard.settings;
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <Panel title={s.title}>
      <div className="space-y-4 text-sm">
        <div>
          <a
            href="/api/account/export"
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium transition hover:bg-muted"
          >
            <Download className="size-4" /> {s.export}
          </a>
          <p className="mt-1.5 text-xs text-muted-foreground">{s.exportNote}</p>
        </div>
        <div>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!confirm(s.deleteConfirm)) return;
              setBusy(true);
              const res = await authClient.deleteUser();
              if (res.error) {
                setBusy(false);
                return alert(dict.auth.errors.generic);
              }
              router.push(href("/"));
              router.refresh();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {busy ? s.deleting : s.delete}
          </button>
          <p className="mt-1.5 text-xs text-muted-foreground">{s.deleteNote}</p>
        </div>
      </div>
    </Panel>
  );
}
