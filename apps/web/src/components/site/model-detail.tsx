"use client";

import { ArrowLeft, ArrowRight, Clock, KeyRound, MessageSquare } from "lucide-react";
import Link from "next/link";
import { CodeBlock } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/provider";
import { MODELS, type Model } from "@/lib/site";
import { KEY_PLACEHOLDER } from "@/lib/snippets";
import { cn } from "@/lib/utils";
import { ModelCard } from "./model-card";

/** Страница модели: цены, характеристики, готовый код и переход в чат (как карточка модели у OpenRouter). */
export function ModelDetail({ model: m, baseUrl }: { model: Model; baseUrl: string }) {
  const { dict, money, t, href } = useI18n();
  const d = dict.cab.model;
  const similar = MODELS.filter((x) => x.id !== m.id && x.tier === m.tier).slice(0, 3);
  const others = similar.length ? similar : MODELS.filter((x) => x.id !== m.id && x.available).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-24 pb-24">
      <Link href={href("/models")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {d.back}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{m.vendor}</span>
            <span>·</span>
            <span>{dict.tiers[m.tier]}</span>
            <span>·</span>
            <span>
              {d.openWeights}: {m.license}
            </span>
            <span
              className={cn(
                "ml-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                m.available ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
              )}
            >
              {m.available ? d.available : d.soon}
            </span>
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{m.name}</h1>
          <p className="mt-2 font-mono text-sm text-muted-foreground">{m.id}</p>
          <p className="mt-4 max-w-xl text-lg text-foreground/80">{dict.taglines[m.id]}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {m.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                {dict.tags[tag]}
              </span>
            ))}
          </div>

          {!m.available && (
            <p className="mt-6 flex max-w-xl items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <Clock className="mt-0.5 size-4 shrink-0" /> {d.soonText}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {m.available && (
              <Link
                href={href(`/dashboard/chat?model=${encodeURIComponent(m.id)}`)}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:bg-foreground/90"
              >
                <MessageSquare className="size-4" /> {d.tryChat}
              </Link>
            )}
            <Link
              href={href("/dashboard/keys?create=1")}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium transition hover:bg-muted"
            >
              <KeyRound className="size-4" /> {d.getKey}
            </Link>
          </div>
        </div>
        <ModelCard model={m} className="mx-auto hidden -rotate-3 lg:flex" />
      </div>

      <dl className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat k={d.input} v={money(m.priceIn)} note={d.per1m} />
        <Stat k={d.output} v={money(m.priceOut)} note={d.per1m} />
        <Stat k={d.perAnswer} v={`≈ ${money(m.typical)}`} note={d.perAnswerNote} />
        <Stat k={d.context} v={m.context} note={dict.catalog.context} />
        <Stat k={d.speed} v={t(dict.units.tps, { n: m.speed })} note="*" />
        <Stat k={d.latency} v={t(dict.units.sec, { n: m.ttft })} note="*" />
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">* {d.metricsNote}</p>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">{d.howTo}</h2>
        <p className="mt-1 text-muted-foreground">{d.howToText}</p>
        <CodeBlock baseUrl={baseUrl} apiKey={KEY_PLACEHOLDER} model={m.id} pickModel={false} className="mt-4" />
        <p className="mt-2 text-xs text-muted-foreground">{dict.cab.code.keyHint}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">{d.similar}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {others.map((x) => (
            <Link
              key={x.id}
              href={href(`/models/${x.id}`)}
              className="shadow-soft group rounded-3xl border border-border bg-card p-5 transition hover:border-foreground/20"
            >
              <p className="text-xs text-muted-foreground">
                {x.vendor} · {dict.tiers[x.tier]}
                {!x.available && ` · ${dict.card.soon}`}
              </p>
              <p className="mt-1 font-semibold">{x.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{dict.taglines[x.id]}</p>
              <p className="mt-3 flex items-center justify-between text-sm">
                <span className="tabular-nums">
                  {money(x.priceIn)} / {money(x.priceOut)}
                </span>
                <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ k, v, note }: { k: string; v: string; note?: string }) {
  return (
    <div className="shadow-soft rounded-2xl border border-border bg-card p-4">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums">{v}</dd>
      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}
