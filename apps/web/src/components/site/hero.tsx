"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Check, ChevronRight, KeyRound, MousePointer2, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MODELS } from "@/lib/site";

const ease = [0.22, 1, 0.36, 1] as const;

function Pop({
  children,
  className,
  delay = 0,
  rotate = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  rotate?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.94, rotate: rotate * 2 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate }}
      transition={{ duration: 0.9, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-28 pb-10 md:pt-24">
      {/* Фон: сетка + свечения (реф. 1) */}
      <div className="bg-grid mask-radial absolute inset-0 -z-10" />
      <div className="absolute top-10 right-[8%] -z-10 size-[520px] rounded-full bg-[var(--glow-violet)] opacity-35 blur-[120px]" />
      <div className="absolute top-40 left-[6%] -z-10 size-[420px] rounded-full bg-[var(--glow-amber)] opacity-40 blur-[120px]" />
      <div className="absolute top-72 left-1/2 -z-10 size-[380px] -translate-x-1/2 rounded-full bg-brand opacity-20 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl px-4 text-center">
        <Pop>
          <Link
            href="/models"
            className="shadow-soft mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1 text-xs"
          >
            <span className="rounded-full bg-foreground px-2 py-0.5 font-medium whitespace-nowrap text-background">Новое ✦</span>
            <span className="truncate text-muted-foreground">
              Claude Sonnet 4.5 <span className="hidden sm:inline">уже</span> в каталоге — <span className="text-foreground underline underline-offset-2">смотреть</span>
            </span>
            <ChevronRight className="size-3.5" />
          </Link>
        </Pop>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease }}
          className="mx-auto mt-8 max-w-4xl text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-6xl md:text-7xl"
        >
          Все AI-модели.
          <br />
          Один{" "}
          <span className="relative inline-block rounded-2xl border border-brand/25 bg-brand-soft/70 px-3 text-brand-strong shadow-[0_8px_30px_-8px_var(--brand)]">
            ключ
          </span>
          .
          <br />
          <span className="text-foreground/35">Оплата в рублях</span>
        </motion.h1>

        {/* Центральная наклонная карточка (как «Appointment» в реф. 1) */}
        <Pop delay={0.55} rotate={-6} className="absolute top-[150px] left-[5%] hidden lg:block">
          <div className="animate-float-slow w-52 rounded-2xl border border-white/60 bg-gradient-to-br from-brand to-teal-700 p-3 text-left text-white shadow-float">
            <p className="text-[11px] text-white/75">Ключ создан</p>
            <p className="font-mono text-sm font-medium">sk-routa-••••7f3a</p>
            <div className="mt-2 flex gap-1.5">
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">GPT-5</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">Claude</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">+6</span>
            </div>
            <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 text-xs font-medium text-foreground">
              <KeyRound className="size-3.5 text-brand-strong" /> Лимит 5 000 ₽ / мес
            </div>
          </div>
        </Pop>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease }}
          className="mx-auto mt-6 max-w-xl text-base text-pretty text-muted-foreground md:text-lg"
        >
          GPT, Claude, Gemini, DeepSeek и Qwen через один OpenAI-совместимый API. Без VPN и зарубежных карт, с
          документами для юрлиц.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            render={<Link href="/sign-in" />}
            nativeButton={false}
            className="h-11 rounded-full px-5 text-sm shadow-[0_10px_30px_-10px_rgb(0_0_0/.5)]"
          >
            Получить ключ бесплатно <ArrowRight />
          </Button>
          <Button
            render={<Link href="/models" />}
            nativeButton={false}
            variant="outline"
            className="h-11 rounded-full bg-card px-5 text-sm"
          >
            Смотреть модели
          </Button>
        </motion.div>
        <p className="mt-3 text-xs text-muted-foreground">100 ₽ на тест после подтверждения почты</p>

        {/* Плавающие карточки вокруг заголовка (реф. 1) */}
        <Pop delay={0.45} rotate={-3} className="absolute top-2 left-4 hidden lg:block">
          <div className="animate-float w-64 rounded-2xl border border-border bg-card p-3.5 text-left shadow-float">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-orange-400 text-sm font-semibold text-white">
                ₽
              </div>
              <div>
                <p className="text-sm font-semibold">Баланс 12 480 ₽</p>
                <p className="text-[11px] text-muted-foreground">СБП · сегодня, 10:42</p>
              </div>
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
              <span>Расход за месяц</span>
              <span>38%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted">
              <div className="h-full w-[38%] rounded-full bg-foreground/80" />
            </div>
          </div>
        </Pop>

        <Pop delay={0.6} rotate={3} className="absolute top-6 right-4 hidden lg:block">
          <div className="animate-float-slow w-64 rounded-2xl border border-border bg-card p-3.5 text-left shadow-float">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-pink-200 to-pink-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://cdn.simpleicons.org/claude/ffffff" alt="" className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Claude Sonnet 4.5</p>
                <p className="text-[11px] text-muted-foreground">71 ток/с · TTFT 1,1 с</p>
              </div>
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
              <span>Аптайм 7 дней</span>
              <span>99,96%</span>
            </div>
            <div className="mt-1 flex h-4 gap-[2px]">
              {Array.from({ length: 28 }).map((_, i) => (
                <span key={i} className={`flex-1 rounded-[2px] ${i === 17 ? "bg-amber-400" : "bg-brand/70"}`} />
              ))}
            </div>
          </div>
        </Pop>

        <Pop delay={0.75} className="absolute top-[300px] left-[7%] hidden lg:block">
          <div className="flex items-center gap-1">
            <MousePointer2 className="size-4 -rotate-12 fill-foreground text-foreground" />
            <div className="flex items-center gap-2 rounded-full bg-foreground py-1.5 pr-3 pl-1.5 text-left text-background shadow-float">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://cdn.simpleicons.org/cursor/ffffff" alt="" className="size-6 rounded-full bg-white/15 p-1" />
              <div>
                <p className="text-xs font-medium">Cursor подключён</p>
                <p className="text-[10px] opacity-60">base_url заменён</p>
              </div>
            </div>
          </div>
        </Pop>

        <Pop delay={0.85} className="absolute top-[320px] right-[8%] hidden lg:block">
          <div className="flex items-center gap-1">
            <MousePointer2 className="size-4 rotate-[80deg] fill-violet-500 text-violet-500" />
            <div className="flex items-center gap-2 rounded-full bg-violet-500 py-1.5 pr-3 pl-1.5 text-left text-white shadow-float">
              <span className="grid size-6 place-items-center rounded-full bg-white/20">
                <Zap className="size-3.5" />
              </span>
              <div>
                <p className="text-xs font-medium">≈ 0,3 ₽ за ответ</p>
                <p className="text-[10px] opacity-75">DeepSeek V3.1</p>
              </div>
            </div>
          </div>
        </Pop>
      </div>

      {/* «Скриншоты» по бокам (реф. 3) */}
      <div className="relative mx-auto mt-10 h-[110px] max-w-6xl px-4 md:mt-14 md:h-[300px]">
        <Pop delay={0.9} rotate={-4} className="absolute bottom-0 left-0 hidden w-[380px] md:block">
          <CodeWindow />
        </Pop>
        <Pop delay={1} rotate={4} className="absolute right-0 bottom-0 hidden w-[360px] md:block">
          <UsageWindow />
        </Pop>

        {/* Иконки интеграций (реф. 3) */}
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-3 md:gap-4">
          {[
            { s: "cursor", r: -8, y: 10 },
            { s: "anthropic", r: 6, y: -8 },
            { s: "googlegemini", r: -4, y: 14 },
            { s: "deepseek", r: 8, y: -4 },
            { s: "qwen", r: -6, y: 8 },
          ].map((it, i) => (
            <Pop key={it.s} delay={1.05 + i * 0.07} rotate={it.r}>
              <div
                className="animate-float grid size-12 place-items-center rounded-2xl border border-border bg-card shadow-float md:size-14"
                style={{ marginTop: it.y, animationDelay: `${i * 0.6}s` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://cdn.simpleicons.org/${it.s}`} alt={it.s} className="size-6" />
              </div>
            </Pop>
          ))}
        </div>
      </div>
    </section>
  );
}

function WindowChrome({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card text-left shadow-float">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[11px] text-muted-foreground">{title}</span>
      </div>
      {children}
    </div>
  );
}

function CodeWindow() {
  return (
    <WindowChrome title="main.py">
      <pre className="overflow-hidden p-4 font-mono text-[11.5px] leading-relaxed">
        <code>
          <span className="text-violet-600">from</span> openai <span className="text-violet-600">import</span> OpenAI
          {"\n\n"}client = OpenAI({"\n"}
          {"  "}base_url=<span className="text-brand-strong">&quot;https://api.routa.ru/v1&quot;</span>,{"\n"}
          {"  "}api_key=<span className="text-brand-strong">&quot;sk-routa-…&quot;</span>,{"\n"}){"\n"}
          r = client.chat.completions.create({"\n"}
          {"  "}model=<span className="text-orange-600">&quot;anthropic/claude-sonnet-4.5&quot;</span>,{"\n"}
          {"  "}messages=[…]){"\n"}
        </code>
      </pre>
      <div className="flex items-center gap-1.5 border-t border-border bg-muted/50 px-4 py-2 text-[11px] text-muted-foreground">
        <Check className="size-3.5 text-brand-strong" /> 200 OK · 1 142 ток · 0,38 ₽
      </div>
    </WindowChrome>
  );
}

function UsageWindow() {
  const bars = [34, 48, 30, 62, 55, 80, 44, 58, 92, 66, 50, 72];
  return (
    <WindowChrome title="Расходы · 12 дней">
      <div className="p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Потрачено</p>
            <p className="text-2xl font-semibold tracking-tight">3 214 ₽</p>
          </div>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-strong">
            <ArrowUpRight className="size-3" /> 12%
          </span>
        </div>
        <div className="mt-4 flex h-24 items-end gap-[3px]">
          {bars.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-[4px] ${i === 8 ? "bg-brand" : "bg-muted"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="mt-3 flex gap-3 text-[11px] text-muted-foreground">
          {MODELS.slice(0, 3).map((m) => (
            <span key={m.id} className="flex items-center gap-1">
              <span className="size-2 rounded-full" style={{ background: m.gradient[2] }} />
              {m.name}
            </span>
          ))}
        </div>
      </div>
    </WindowChrome>
  );
}
