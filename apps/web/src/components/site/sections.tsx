"use client";

import {
  ArrowRight,
  Building2,
  Check,
  CircleDot,
  CreditCard,
  FileText,
  KeyRound,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Eyebrow, Reveal } from "@/components/site/reveal";
import { PendingButton } from "@/components/site/pending-button";
import BeamBorder from "@/components/ui/border-beam";
import { MarqueeLogoScroller } from "@/components/ui/marquee-logo-scroller";
import { BRAND, INTEGRATIONS, MODELS } from "@/lib/site";
import { cn } from "@/lib/utils";

/* ——— Лента моделей под hero (реф. 1) ——— */
export function ModelStrip() {
  const row = [...MODELS, ...MODELS];
  return (
    <section className="relative border-y border-border bg-card/60">
      <div className="mx-auto flex max-w-6xl items-center">
        <p className="hidden shrink-0 border-r border-border px-6 py-6 text-xs leading-tight text-muted-foreground md:block">
          Доступно
          <br />
          по одному ключу
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
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <div className="text-center">
        <Eyebrow>Как подключить</Eyebrow>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance md:text-5xl">Три шага до первого ответа</h2>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Reveal rotate={-3}>
          <StepCard n={1} title="Создайте ключ." sub="Почта, пароль — готово.">
            <div className="flex items-center gap-2 rounded-2xl bg-card p-2 pl-4 shadow-soft">
              <span className="font-mono text-xs text-muted-foreground">sk-routa-…</span>
              <span className="ml-auto rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-[0_8px_20px_-8px_var(--brand)]">
                Создать ключ
              </span>
            </div>
          </StepCard>
        </Reveal>
        <Reveal delay={0.1}>
          <StepCard n={2} title="Замените base_url." sub="SDK OpenAI, Cursor, n8n — без правок кода.">
            <div className="relative space-y-2">
              <div className="ml-8 rounded-2xl rounded-tr-sm bg-card p-2.5 font-mono text-[11px] shadow-soft">
                base_url = <span className="text-brand-strong">&quot;api.routa.ru/v1&quot;</span>
              </div>
              <div className="mr-8 flex items-start gap-2 rounded-2xl rounded-tl-sm bg-card p-2.5 text-xs shadow-soft">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-violet-100 text-[10px]">AI</span>
                Привет! Чем помочь? <span className="ml-auto rounded bg-brand-soft px-1 text-[10px] text-brand-strong">0,04 ₽</span>
              </div>
            </div>
          </StepCard>
        </Reveal>
        <Reveal delay={0.2} rotate={3}>
          <StepCard n={3} title="Следите за расходом." sub="По ключам, моделям и дням.">
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
  return (
    <div className="shadow-soft flex h-full flex-col gap-10 rounded-[32px] border-[6px] border-card bg-gradient-to-b from-background to-muted/60 p-6">
      <div className="min-h-28 pt-4">{children}</div>
      <div>
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Шаг {n}</p>
        <p className="mt-2 text-lg leading-snug">
          <span className="font-semibold">{title}</span> <span className="text-muted-foreground">{sub}</span>
        </p>
      </div>
    </div>
  );
}

/* ——— Отзыв + «с кем мы работаем» (реф. 2 + marquee-logo-scroller) ——— */
const QUOTES = [
  {
    name: "Анна Крылова",
    role: "CTO, студия чат-ботов",
    title: "Переехали с OpenRouter за вечер",
    text: "Поменяли base_url, и всё заработало. Главное — закрывающие документы: бухгалтерия наконец перестала спрашивать, что это за доллары.",
    img: "https://i.pravatar.cc/120?img=47",
  },
  {
    name: "Илья Мартынов",
    role: "Инди-разработчик",
    title: "Claude Code без VPN",
    text: "Пишу агентом по 6 часов в день. Резервный источник спасал уже дважды — я узнал об этом только из статус-страницы.",
    img: "https://i.pravatar.cc/120?img=12",
  },
  {
    name: "Мария Лебедева",
    role: "Руководитель ML, e-commerce",
    title: "Лимиты на каждый ключ",
    text: "Выдали ключи трём командам с разными бюджетами. Никто не сжёг месячный бюджет за выходные — впервые.",
    img: "https://i.pravatar.cc/120?img=32",
  },
];

export function Testimonials() {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % QUOTES.length), 6000);
    return () => clearInterval(t);
  }, []);
  const q = QUOTES[i];
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      <div className="mx-auto max-w-xl text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={q.img} src={q.img} alt="" className="mx-auto size-16 rounded-full object-cover shadow-float" />
        <p className="mt-4 text-xl font-semibold">{q.title}</p>
        <p className="mt-2 text-muted-foreground">«{q.text}»</p>
        <p className="mt-3 text-sm text-muted-foreground/70">
          — {q.name}, {q.role}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {QUOTES.map((x, k) => (
            <button
              key={x.name}
              onClick={() => setI(k)}
              aria-label={`Отзыв ${k + 1}`}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs transition",
                k === i ? "border-foreground/10 bg-card font-medium shadow-soft" : "border-transparent text-muted-foreground",
              )}
            >
              {x.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <MarqueeLogoScroller
          title="С кем мы работаем"
          description="Ключ работает везде, где можно указать OpenAI-совместимый base_url: IDE, агенты, no-code и чат-клиенты."
          logos={INTEGRATIONS.map((x) => ({
            src: `https://cdn.simpleicons.org/${x.icon}`,
            alt: x.name,
            gradient: x.gradient,
          }))}
          speed="normal"
        />
      </div>
    </section>
  );
}

/* ——— Возможности: бенто (реф. 5) ——— */
export function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <div className="text-center">
        <Eyebrow>Возможности</Eyebrow>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance md:text-5xl">Что {BRAND} берёт на себя</h2>
        <p className="mt-3 text-muted-foreground">Чтобы вы думали о продукте, а не о доступе к моделям.</p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
        <Reveal>
          <Bento title="Лимиты на каждый ключ" text="Бюджет, белый список моделей и IP. Ключ стажёра не потратит месячный бюджет за ночь.">
            <div className="space-y-2">
              {[
                { n: "prod-backend", b: "20 000 ₽", u: 62, on: true },
                { n: "intern-cursor", b: "1 500 ₽", u: 91, on: true },
                { n: "old-bot", b: "—", u: 0, on: false },
              ].map((k) => (
                <div key={k.n} className="flex items-center gap-3 rounded-xl bg-card px-3 py-2 text-xs shadow-soft">
                  <KeyRound className="size-3.5 text-muted-foreground" />
                  <span className="font-mono">{k.n}</span>
                  <div className="ml-auto h-1.5 w-12 rounded-full bg-muted sm:w-20">
                    <div className={cn("h-full rounded-full", k.u > 85 ? "bg-amber-400" : "bg-brand")} style={{ width: `${k.u}%` }} />
                  </div>
                  <span className="hidden w-16 text-right text-muted-foreground sm:inline">{k.b}</span>
                  <span className={cn("size-2 rounded-full", k.on ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                </div>
              ))}
            </div>
          </Bento>
        </Reveal>

        <Reveal delay={0.1}>
          <Bento title="Резервные источники" text="У каждой модели минимум два апстрима. Упал один — запрос уйдёт на другой, вы увидите только 200 OK.">
            <div className="flex items-center justify-center gap-3 text-xs">
              <div className="rounded-xl bg-card px-3 py-2 font-mono shadow-soft">ваш запрос</div>
              <ArrowRight className="size-4 text-muted-foreground" />
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 line-through opacity-50 shadow-soft">
                  <CircleDot className="size-3 text-red-500" /> источник A · 429
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 shadow-soft ring-2 ring-brand/40">
                  <RefreshCw className="size-3 text-brand-strong" /> источник B · 200
                </div>
              </div>
            </div>
          </Bento>
        </Reveal>

        <Reveal>
          <Bento title="Документы для бизнеса" text="Договор, счёт, акты и ЭДО. Оплата с расчётного счёта, НДС в цене.">
            <div className="flex justify-center gap-3">
              {[
                { i: FileText, t: "Договор", c: "bg-violet-100 text-violet-600" },
                { i: Building2, t: "Счёт", c: "bg-amber-100 text-amber-600" },
                { i: ShieldCheck, t: "Акт · ЭДО", c: "bg-brand-soft text-brand-strong" },
              ].map(({ i: Icon, t, c }, k) => (
                <div
                  key={t}
                  className="flex w-24 flex-col items-center gap-2 rounded-2xl bg-card p-3 text-xs shadow-soft"
                  style={{ rotate: `${(k - 1) * 5}deg` }}
                >
                  <span className={cn("grid size-10 place-items-center rounded-xl", c)}>
                    <Icon className="size-5" />
                  </span>
                  {t}
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
              <p className="text-xs font-bold tracking-[0.12em] text-[#66D933] uppercase">Для вайб-кодинга</p>
              <h3 className="text-2xl leading-tight font-medium">Claude Code, Cursor и Cline — за две минуты.</h3>
              <p className="text-sm text-white/60">
                Готовые конфиги для IDE и агентов: копируете одну строку — и модель уже пишет код через наш ключ.
              </p>
              <pre className="rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-[11px] text-white/80">
                export ANTHROPIC_BASE_URL=https://api.routa.ru{"\n"}export ANTHROPIC_AUTH_TOKEN=sk-routa-…
              </pre>
              <Link
                href="/models"
                className="mt-auto w-fit rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95"
              >
                Открыть гайды
              </Link>
            </div>
          </BeamBorder>
        </Reveal>

        <Reveal className="md:col-span-2">
          <Bento
            title="Подробная аналитика"
            text="Расход по дням, моделям и ключам, экспорт в CSV. Видно, что работает, а что стоит заменить на модель подешевле."
          >
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
  const data = [40, 55, 35, 72, 48, 60, 90, 52, 44, 68, 58, 76, 50, 63, 70, 46, 81, 57];
  const [hover, setHover] = React.useState(6);
  return (
    <div className="relative w-full">
      <div className="absolute inset-x-0 top-[28%] border-t-2 border-dashed border-brand/40" />
      <div className="flex h-44 items-end gap-2">
        {data.map((h, i) => (
          <button
            key={i}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            aria-label={`${i + 1} сентября: ${h * 42} ₽`}
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
                <span className="text-muted-foreground">{i + 1} сен · </span>
                <span className="font-semibold">{(h * 42).toLocaleString("ru-RU")} ₽</span>
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
  const presets = [300, 1000, 5000];
  const [amount, setAmount] = React.useState(1000);
  const [method, setMethod] = React.useState<"sbp" | "card" | "invoice">("sbp");
  return (
    <section id="pricing" className="mx-auto grid max-w-6xl scroll-mt-24 gap-10 px-4 py-24 md:grid-cols-2 md:items-center">
      <div>
        <Eyebrow>Цены</Eyebrow>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance md:text-5xl">Платите только за токены</h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          Без подписок. Пополняете баланс в рублях — каждый запрос списывается по фиксированной цене модели. Неизрасходованный
          остаток вернём по заявке.
        </p>
        <ul className="mt-6 space-y-2 text-sm">
          {["Цена за 1M токенов и за типичный ответ", "Чек по 54-ФЗ на каждое пополнение", "Письмо, когда баланс заканчивается"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check className="size-4 text-brand-strong" /> {t}
            </li>
          ))}
        </ul>
      </div>

      <BeamBorder size="md" colorVariant="ocean" theme="light" strength={1} duration={4} className="w-full">
        <form id="topup" className="rounded-[28px] bg-card p-6 shadow-float md:p-8" onSubmit={(e) => e.preventDefault()}>
          <p className="text-sm text-muted-foreground">Пополнить баланс</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight">{amount.toLocaleString("ru-RU")} ₽</p>
          <p className="text-xs text-muted-foreground">≈ {Math.round(amount / DEEPSEEK.typical).toLocaleString("ru-RU")} ответов {DEEPSEEK.name}</p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {presets.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setAmount(p)}
                className={cn(
                  "rounded-xl border py-2.5 text-sm font-medium transition",
                  amount === p ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/30",
                )}
              >
                {p.toLocaleString("ru-RU")} ₽
              </button>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="sr-only">Своя сумма</span>
            <input
              type="number"
              min={100}
              step={100}
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-3 focus:ring-brand/20"
            />
          </label>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            {[
              { k: "sbp", t: "СБП", i: QrCode },
              { k: "card", t: "Карта", i: CreditCard },
              { k: "invoice", t: "Счёт юрлицу", i: Building2 },
            ].map(({ k, t, i: Icon }) => (
              <button
                type="button"
                key={k}
                onClick={() => setMethod(k as typeof method)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border py-3 transition",
                  method === k ? "border-brand bg-brand-soft/60 text-brand-strong" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" /> {t}
              </button>
            ))}
          </div>

          <PendingButton
            type="submit"
            pendingLabel="Создаём платёж…"
            doneLabel="Ссылка на оплату готова"
            className="mt-5 h-12 w-full rounded-xl text-sm"
          >
            {method === "invoice" ? "Выставить счёт" : `Оплатить ${amount.toLocaleString("ru-RU")} ₽`}
          </PendingButton>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">Минимум 100 ₽ · зачисление после подтверждения банком</p>
        </form>
      </BeamBorder>
    </section>
  );
}

/* ——— FAQ ——— */
const FAQ = [
  ["Это законно?", "Мы российская компания: договор-оферта, чеки по 54-ФЗ, закрывающие документы. Вы покупаете у нас услугу доступа к API."],
  ["Нужно ли менять код?", "Нет. Мы совместимы с OpenAI API: меняете base_url и ключ — остальное работает как было."],
  ["Что будет, если модель у вендора недоступна?", "Запрос автоматически уйдёт в резервный источник. Если живых источников нет — вернём 503, деньги не спишутся."],
  ["Храните ли вы мои промпты?", "По умолчанию нет — только метаданные: модель, токены, стоимость. Хранение содержимого включается вручную."],
  ["Можно вернуть деньги?", "Да, неизрасходованный остаток возвращаем по заявке в течение 10 рабочих дней."],
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-24">
      <div className="text-center">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">Частые вопросы</h2>
      </div>
      <div className="mt-10 space-y-3">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group shadow-soft rounded-2xl border border-border bg-card px-5 py-4 open:pb-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {q}
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-sm transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ——— Тёмный CTA + футер (реф. 5, низ) ——— */
export function CtaFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-6">
      <div className="relative overflow-hidden rounded-[32px] bg-[#111] p-8 text-white md:p-12">
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-[0.15] invert" />
        <div className="pointer-events-none absolute -right-20 -bottom-40 size-[420px] rounded-full bg-brand/30 blur-[100px]" />
        <div className="relative max-w-lg">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Первый запрос — через две минуты</h2>
          <p className="mt-3 text-white/60">100 ₽ на тест после подтверждения почты. Без карты.</p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-black transition hover:scale-[1.03] active:scale-95"
          >
            Получить ключ <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="relative mt-16 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-[1.4fr_1fr_1.4fr]">
          <div>
            <p className="font-semibold">{BRAND}</p>
            <p className="mt-2 max-w-xs text-sm text-white/50">Один API-ключ к GPT, Claude, Gemini и open-source моделям. Оплата в рублях.</p>
          </div>
          <ul className="space-y-2 text-sm text-white/60">
            {[
              ["/models", "Модели"],
              ["/compare", "Сравнение"],
              ["/#pricing", "Цены"],
              ["/sign-in", "Личный кабинет"],
            ].map(([h, t]) => (
              <li key={h}>
                <Link href={h} className="hover:text-white">
                  {t}
                </Link>
              </li>
            ))}
          </ul>
          <div>
            <p className="text-sm font-medium">Новые модели и снижение цен — раз в месяц</p>
            <form id="subscribe" className="mt-3 flex gap-2 rounded-full bg-white/10 p-1" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="you@company.ru"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/40"
              />
              <PendingButton
                type="submit"
                pendingLabel="Отправляем…"
                doneLabel="Готово"
                className="h-9 rounded-full bg-white px-4 text-black hover:bg-white/90"
              >
                Подписаться
              </PendingButton>
            </form>
          </div>
        </div>
        <p className="relative mt-10 text-xs text-white/35">© 2026 {BRAND}. Демо-макет: цены и метрики условные.</p>
      </div>
    </footer>
  );
}
