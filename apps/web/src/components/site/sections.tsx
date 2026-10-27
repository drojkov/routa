"use client";

import {
  ArrowRight,
  Building2,
  Check,
  CircleDot,
  CreditCard,
  FileText,
  KeyRound,

  ReceiptText,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { OPEN_COOKIE_SETTINGS } from "@/components/site/cookie-banner";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { Eyebrow, Reveal } from "@/components/site/reveal";
import BeamBorder from "@/components/ui/border-beam";
import { MarqueeLogoScroller } from "@/components/ui/marquee-logo-scroller";
import { MAX_TOPUP_USD, MIN_TOPUP_USD, TOPUP_PACKAGES_USD } from "@/lib/billing";
import { fmtNodes } from "@/i18n/fmt";
import { useI18n } from "@/i18n/provider";
import { API_BASE, BRAND, COMPANY, INTEGRATIONS, MODELS, SUPPORT_RESPONSE_DAYS } from "@/lib/site";
import { cn } from "@/lib/utils";

/* ——— Лента моделей под hero (реф. 1) ——— */
export function ModelStrip() {
  const { dict } = useI18n();
  const row = [...MODELS, ...MODELS];
  return (
    <section className="relative border-y border-border bg-card/60">
      <div className="mx-auto flex max-w-6xl items-center">
        <p className="hidden shrink-0 border-r border-border px-6 py-6 text-xs leading-tight text-muted-foreground md:block">
          {dict.strip.line1}
          <br />
          {dict.strip.line2}
        </p>
        <div className="mask-fade-x pause-on-hover overflow-hidden py-6">
          <ul className="animate-marquee flex w-max items-center gap-12 px-6" style={{ "--marquee-duration": "45s" } as React.CSSProperties}>
            {row.map((m, i) => (
              <li
                key={`${m.id}-${i}`}
                aria-hidden={i >= MODELS.length}
                className="flex items-center gap-2 text-lg font-semibold tracking-tight whitespace-nowrap text-foreground/45 transition-colors hover:text-foreground"
              >
                <span className="size-2.5 rounded-full" style={{ background: m.gradient[2] }} />
                {m.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ——— Три шага (реф. 2) ——— */
export function Steps() {
  const { dict, money } = useI18n();
  const s = dict.steps;
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <div className="text-center">
        <Eyebrow>{s.eyebrow}</Eyebrow>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance md:text-5xl">{s.title}</h2>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Reveal rotate={-3}>
          <StepCard n={1} title={s.s1Title} sub={s.s1Sub}>
            <div className="flex items-center gap-2 rounded-2xl bg-card p-2 pl-4 shadow-soft">
              <span className="font-mono text-xs text-muted-foreground">sk-harvanera-…</span>
              <span className="ml-auto rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-[0_8px_20px_-8px_var(--brand)]">
                {s.s1Button}
              </span>
            </div>
          </StepCard>
        </Reveal>
        <Reveal delay={0.1}>
          <StepCard n={2} title={s.s2Title} sub={s.s2Sub}>
            <div className="relative space-y-2">
              <div className="ml-8 rounded-2xl rounded-tr-sm bg-card p-2.5 font-mono text-[11px] shadow-soft">
                base_url = <span className="text-brand-strong">&quot;{API_BASE.replace("https://", "")}&quot;</span>
              </div>
              <div className="mr-8 flex items-start gap-2 rounded-2xl rounded-tl-sm bg-card p-2.5 text-xs shadow-soft">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-violet-100 text-[10px]">AI</span>
                {s.s2Reply} <span className="ml-auto rounded bg-brand-soft px-1 text-[10px] text-brand-strong">{money(0.0004)}</span>
              </div>
            </div>
          </StepCard>
        </Reveal>
        <Reveal delay={0.2} rotate={3}>
          <StepCard n={3} title={s.s3Title} sub={s.s3Sub}>
            <div className="relative flex h-24 items-end justify-center gap-3">
              <div className="absolute inset-x-0 top-6 border-t-2 border-dashed border-brand/50" />
              {[45, 62, 100, 38].map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-10 rounded-t-xl",
                    i === 2 ? "bg-gradient-to-b from-brand to-brand/10 shadow-[0_0_24px_var(--brand)]" : "bg-gradient-to-b from-foreground/12 to-foreground/0",
                  )}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </StepCard>
        </Reveal>
      </div>
    </section>
  );
}

function StepCard({ n, title, sub, children }: { n: number; title: string; sub: string; children: React.ReactNode }) {
  const { dict, t } = useI18n();
  return (
    <div className="shadow-soft flex h-full flex-col gap-10 rounded-[32px] border-[6px] border-card bg-gradient-to-b from-background to-muted/60 p-6">
      <div className="min-h-28 pt-4">{children}</div>
      <div>
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t(dict.steps.step, { n })}</p>
        <p className="mt-2 text-lg leading-snug">
          <span className="font-semibold">{title}</span> <span className="text-muted-foreground">{sub}</span>
        </p>
      </div>
    </div>
  );
}

/* ——— «С кем мы работаем» (marquee-logo-scroller) ———
 * Блок отзывов убран 2026-10-27: отзывы были выдуманными (замечание эквайера). Вернуть — только реальные, с согласия авторов. */
export function Testimonials() {
  const { dict } = useI18n();
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <MarqueeLogoScroller
        title={dict.testimonials.integrationsTitle}
        description={dict.testimonials.integrationsText}
        logos={INTEGRATIONS.map((x) => ({ src: x.logo, alt: x.name, gradient: x.gradient }))}
        speed="normal"
      />
    </section>
  );
}

export function Features() {
  const { dict, href, money, t } = useI18n();
  const f = dict.features;
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <div className="text-center">
        <Eyebrow>{f.eyebrow}</Eyebrow>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance md:text-5xl">{t(f.title, { brand: BRAND })}</h2>
        <p className="mt-3 text-muted-foreground">{f.sub}</p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Reveal>
          <Bento title={f.keysTitle} text={f.keysText}>
            <div className="space-y-2">
              {[
                { n: "prod-backend", b: 200, u: 62, on: true },
                { n: "intern-cursor", b: 15, u: 91, on: true },
                { n: "old-bot", b: null, u: 0, on: false },
              ].map((k) => (
                <div key={k.n} className="flex items-center gap-3 rounded-xl bg-card px-3 py-2 text-xs shadow-soft">
                  <KeyRound className="size-3.5 text-muted-foreground" />
                  <span className="font-mono">{k.n}</span>
                  <div className="ml-auto h-1.5 w-12 rounded-full bg-muted sm:w-20">
                    <div className={cn("h-full rounded-full", k.u > 85 ? "bg-amber-400" : "bg-brand")} style={{ width: `${k.u}%` }} />
                  </div>
                  <span className="hidden w-16 text-right text-muted-foreground sm:inline">{k.b ? money(k.b, { compact: true }) : "—"}</span>
                  <span className={cn("size-2 rounded-full", k.on ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                </div>
              ))}
            </div>
          </Bento>
        </Reveal>

        <Reveal delay={0.1}>
          <Bento title={f.fallbackTitle} text={f.fallbackText}>
            <div className="flex items-center justify-center gap-3 text-xs">
              <div className="rounded-xl bg-card px-3 py-2 font-mono shadow-soft">{f.yourRequest}</div>
              <ArrowRight className="size-4 text-muted-foreground" />
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 line-through opacity-50 shadow-soft">
                  <CircleDot className="size-3 text-red-500" /> {f.sourceA}
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 shadow-soft ring-2 ring-brand/40">
                  <RefreshCw className="size-3 text-brand-strong" /> {f.sourceB}
                </div>
              </div>
            </div>
          </Bento>
        </Reveal>

        <Reveal>
          <Bento title={f.businessTitle} text={f.businessText}>
            <div className="flex justify-center gap-3">
              {[
                { i: FileText, t: f.docInvoice, c: "bg-violet-100 text-violet-600" },
                { i: Building2, t: f.docStatement, c: "bg-amber-100 text-amber-600" },
                { i: ReceiptText, t: f.docReceipt, c: "bg-brand-soft text-brand-strong" },
              ].map(({ i: Icon, t: label, c }, k) => (
                <div
                  key={label}
                  className="flex w-24 flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center text-xs shadow-soft"
                  style={{ rotate: `${(k - 1) * 5}deg` }}
                >
                  <span className={cn("grid size-10 place-items-center rounded-xl", c)}>
                    <Icon className="size-5" />
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </Bento>
        </Reveal>

        {/* Featured-карточка из borderbeam.txt */}
        <Reveal delay={0.1}>
          <BeamBorder size="md" colorVariant="colorful" theme="dark" active strength={1} duration={3.3} beamWidth={2} className="h-full">
            <div className="relative flex h-full min-h-[300px] flex-col gap-4 rounded-[28px] p-8 text-white" style={{ backgroundColor: "#150321" }}>
              <div className="pointer-events-none absolute -top-10 -right-10 size-56 rounded-full bg-violet-500/30 blur-3xl" />
              <p className="text-xs font-bold tracking-[0.12em] text-[#66D933] uppercase">{f.vibeEyebrow}</p>
              <h3 className="text-2xl leading-tight font-medium">{f.vibeTitle}</h3>
              <p className="text-sm text-white/60">{f.vibeText}</p>
              <pre className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-[11px] text-white/80">
                {/* Cursor / Cline / Roo Code: провайдер «OpenAI Compatible». Формата Anthropic (/v1/messages) у шлюза нет. */}
                Base URL: {API_BASE}{"\n"}API key:  sk-harvanera-…{"\n"}Model:    qwen/qwen3-coder
              </pre>
              <Link
                href={href("/models")}
                className="mt-auto w-fit rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95"
              >
                {f.vibeCta}
              </Link>
            </div>
          </BeamBorder>
        </Reveal>

        <Reveal className="md:col-span-2">
          <Bento title={f.analyticsTitle} text={f.analyticsText}>
            <AnalyticsBars />
          </Bento>
        </Reveal>
      </div>
    </section>
  );
}

function Bento({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="shadow-soft flex h-full flex-col rounded-[28px] border-[6px] border-card bg-gradient-to-b from-background to-muted/50 p-6">
      <div className="flex min-h-40 flex-1 items-center justify-center py-4">{children}</div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function AnalyticsBars() {
  const { money, date } = useI18n();
  const data = [40, 55, 35, 72, 48, 60, 90, 52, 44, 68, 58, 76, 50, 63, 70, 46, 81, 57];
  const [hover, setHover] = React.useState(6);
  const day = (i: number) => date(new Date(2026, 8, i + 1), { day: "numeric", month: "short" });
  return (
    <div className="relative w-full">
      <div className="absolute inset-x-0 top-[28%] border-t-2 border-dashed border-brand/40" />
      <div className="flex h-44 items-end gap-2">
        {data.map((h, i) => (
          <button
            key={i}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            aria-label={`${day(i)}: ${money(h * 0.45)}`}
            className="relative flex h-full flex-1 items-end"
          >
            <span
              className={cn(
                "w-full rounded-t-[4px] transition-all duration-300",
                i === hover ? "bg-gradient-to-b from-brand to-brand/20 shadow-[0_0_24px_var(--brand)]" : "bg-gradient-to-b from-muted-foreground/15 to-transparent",
              )}
              style={{ height: `${h}%` }}
            />
            {i === hover && (
              <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-card px-2 py-1 text-[11px] whitespace-nowrap shadow-float">
                <span className="text-muted-foreground">{day(i)} · </span>
                <span className="font-semibold">{money(h * 0.45)}</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ——— Пополнение (кнопка сабмит + border-beam) ——— */
const DEEPSEEK = MODELS.find((m) => m.id === "deepseek/deepseek-v3.1")!;

export function Pricing() {
  const { dict, href, money, num, t, currency } = useI18n();
  const router = useRouter();
  const p = dict.pricing;
  const [usd, setUsd] = React.useState(25);
  const [method, setMethod] = React.useState<string>("card");
  const methods = [
    { k: "card", t: p.card, i: CreditCard },
    { k: "wallet", t: p.wallet, i: Smartphone },
    { k: "invoice", t: p.invoice, i: Building2 },
  ] as const;
  const active = methods.some((m) => m.k === method) ? method : "card";

  return (
    <section id="pricing" className="mx-auto grid max-w-6xl scroll-mt-24 gap-10 px-4 py-24 md:grid-cols-2 md:items-center">
      <div>
        <Eyebrow>{p.eyebrow}</Eyebrow>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance md:text-5xl">{p.title}</h2>
        <p className="mt-4 max-w-md text-muted-foreground">{p.text}</p>
        <ul className="mt-6 space-y-2 text-sm">
          {p.bullets.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <Check className="size-4 text-brand-strong" /> {b}
            </li>
          ))}
        </ul>
      </div>

      <BeamBorder size="md" colorVariant="ocean" theme="light" strength={1} duration={4} className="w-full">
        <form
          id="topup"
          className="rounded-[28px] bg-card p-6 shadow-float md:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(href(`/dashboard/billing?topup=${usd}&method=${active}`));
          }}
        >
          <p className="text-sm text-muted-foreground">{p.formLabel}</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight">{money(usd)}</p>
          <p className="text-xs text-muted-foreground">
            {t(p.approx, { n: num(Math.round(usd / DEEPSEEK.typical), 0), model: DEEPSEEK.name })}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {TOPUP_PACKAGES_USD.map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setUsd(v)}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-medium transition",
                  usd === v ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/30",
                )}
              >
                {money(v, { compact: true })}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {methods.map(({ k, t: label, i: Icon }) => (
              <button
                type="button"
                key={k}
                onClick={() => setMethod(k)}
                aria-pressed={active === k}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-1 py-3 text-center transition",
                  active === k ? "border-brand bg-brand-soft/60 text-brand-strong" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition hover:bg-primary/90 active:scale-[0.99]"
          >
            {active === "invoice" ? p.invoiceCta : t(p.pay, { amount: money(usd) })} <ArrowRight className="size-4" />
          </button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">{t(p.min, { min: money(MIN_TOPUP_USD), max: money(MAX_TOPUP_USD) })}</p>
          {currency !== "USD" && <p className="mt-1 text-center text-[11px] text-muted-foreground/80">{p.chargedIn}</p>}
        </form>
      </BeamBorder>
    </section>
  );
}

/* ——— FAQ ——— */
export function Faq() {
  const { dict } = useI18n();
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-24">
      <div className="text-center">
        <Eyebrow>{dict.faq.eyebrow}</Eyebrow>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance md:text-5xl">{dict.faq.title}</h2>
      </div>
      <div className="mt-10 space-y-3">
        {dict.faq.items.map(({ q, a }) => (
          <details key={q} className="group shadow-soft rounded-2xl border border-border bg-card px-5 py-4 open:pb-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {q}
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-sm transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ——— Тёмный CTA + футер (реф. 5, низ) ——— */
const LEGAL_LINKS = ["terms", "privacy", "cookies", "refunds", "acceptable-use"] as const;

export function CtaFooter() {
  const { dict, href, money, t } = useI18n();
  const f = dict.footer;
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-6">
      <div className="relative overflow-hidden rounded-[32px] bg-[#111] p-8 text-white md:p-12">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-[0.15] invert" />
        <div className="pointer-events-none absolute -right-20 -bottom-40 size-[420px] rounded-full bg-brand/30 blur-[100px]" />
        <div className="relative max-w-lg">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{f.ctaTitle}</h2>
          <p className="mt-3 text-white/60">{t(f.ctaText, { amount: money(1) })}</p>
          <Link
            href={href("/sign-up")}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-black transition hover:scale-[1.03] active:scale-95"
          >
            {f.ctaButton} <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="relative mt-16 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-[1.3fr_0.8fr_1fr_1.4fr]">
          <div>
            <p className="font-semibold">{BRAND}</p>
            <p className="mt-2 max-w-xs text-sm text-white/50">{f.tagline}</p>
            <LocaleSwitcher dark up align="left" className="mt-4 -ml-2.5" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-wider text-white/40 uppercase">{f.product}</p>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              {[
                ["/models", dict.nav.models],
                ["/compare", dict.nav.compare],
                ["/#pricing", dict.nav.pricing],
                ["/dashboard", f.dashboard],
              ].map(([h, label]) => (
                <li key={h}>
                  <Link href={href(h)} className="hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wider text-white/40 uppercase">{f.legal}</p>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              {LEGAL_LINKS.map((k) => (
                <li key={k}>
                  <Link href={href(`/legal/${k}`)} className="hover:text-white">
                    {dict.legalNames[k]}
                  </Link>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))} className="hover:text-white">
                  {f.cookieSettings}
                </button>
              </li>
            </ul>
          </div>
          {/* Реквизиты и контакты поддержки — на каждой странице (требование эквайера). */}
          <div>
            <p className="text-xs font-medium tracking-wider text-white/40 uppercase">{f.support}</p>
            <address className="mt-3 space-y-1 text-sm text-white/60 not-italic">
              <p className="text-white/80">{COMPANY.legalName}</p>
              <p className="text-xs">{t(dict.merchant.regNo, { n: COMPANY.crNumber })}</p>
              <p className="text-xs">{COMPANY.address}</p>
              <p className="pt-1">
                <a href={`mailto:${COMPANY.email}`} className="hover:text-white">
                  {COMPANY.email}
                </a>
              </p>
              <p>
                <Link href={href("/contact")} className="underline underline-offset-2 hover:text-white">
                  {f.contactUs}
                </Link>
              </p>
              <p className="text-xs text-white/40">{t(dict.merchant.response, { days: SUPPORT_RESPONSE_DAYS })}</p>
            </address>
          </div>
        </div>
        {/* Знаки платёжных систем: официальные цвета, без изменений пропорций (правила брендов Visa и Mastercard). */}
        <div className="relative mt-10 flex items-center gap-2">
          {[
            { src: "/logos/visa.svg", alt: "Visa", w: "w-10" },
            { src: "/logos/mastercard.svg", alt: "Mastercard", w: "w-8" },
            // Поставлено по решению владельца (2026-10-27), хотя компания не сертифицирована — см. CLAUDE.md.
            { src: "/logos/pci-dss.svg", alt: "PCI DSS", w: "w-12", box: "w-16" },
          ].map((c) => (
            <span key={c.alt} className={`grid h-7 ${c.box ?? "w-12"} place-items-center rounded-md bg-white`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.src} alt={c.alt} className={`${c.w} h-auto`} />
            </span>
          ))}
        </div>
        <p className="relative mt-4 text-xs text-white/35">
          {t(f.rights, { year: new Date().getFullYear(), company: COMPANY.legalName })} {t(f.registered, { jurisdiction: COMPANY.jurisdiction })}{" "}
          {/* Атрибуция обязательна по лицензии базы DB-IP Lite (CC BY 4.0), см. lib/geo.ts */}
          {fmtNodes(f.geo, {
            dbip: (
              <a key="d" href="https://db-ip.com" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white">
                DB-IP
              </a>
            ),
          })}
        </p>
      </div>
    </footer>
  );
}
