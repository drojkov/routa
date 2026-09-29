"use client";

import { ArrowRight, BarChart3, Check, KeyRound, Layers, MessageSquare, Wallet } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/i18n/provider";
import { MODELS } from "@/lib/site";
import { KEY_PLACEHOLDER } from "@/lib/snippets";
import { cn } from "@/lib/utils";
import { modelColor } from "./activity";
import { CodeBlock, Panel, Tile } from "./ui";

type Recent = { id: string; at: number; model: string; source: string | null; costUsd: number; status: number };

export function Overview({
  name,
  balanceUsd,
  monthUsd,
  monthRequests,
  activeKeys,
  recent,
  baseUrl,
}: {
  name: string;
  balanceUsd: number;
  monthUsd: number;
  monthRequests: number;
  activeKeys: number;
  recent: Recent[];
  baseUrl: string;
}) {
  const { dict, money, t, href, date } = useI18n();
  const d = dict.dashboard;
  const o = dict.cab.overview;
  const available = MODELS.filter((m) => m.available).length;

  const steps = [
    { done: activeKeys > 0, icon: KeyRound, title: o.step1, text: o.step1Text, action: o.step1Action, to: "/dashboard/keys?create=1" },
    { done: monthRequests > 0, icon: Layers, title: o.step2, text: o.step2Text, action: o.step2Action, to: "/models" },
    { done: monthRequests > 0, icon: MessageSquare, title: o.step3, text: o.step3Text, action: o.step3Action, to: "/dashboard/chat" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{t(d.hello, { name: name.split(" ")[0] })}</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Tile icon={Wallet} label={d.balance} value={money(balanceUsd)} accent>
          <Link
            href={href("/dashboard/billing")}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-medium text-background transition hover:bg-foreground/90"
          >
            {dict.cab.topUp}
          </Link>
        </Tile>
        <Tile icon={BarChart3} label={d.spentMonth} value={money(monthUsd)} note={t(o.requestsMonth, { n: monthRequests })}>
          <Link href={href("/dashboard/activity")} className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            {dict.cab.nav.activity} <ArrowRight className="size-3.5" />
          </Link>
        </Tile>
        <Tile icon={KeyRound} label={d.activeKeys} value={String(activeKeys)} note={`${available} / ${MODELS.length} ${dict.nav.models.toLowerCase()}`}>
          <Link href={href("/dashboard/keys")} className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            {dict.cab.nav.keys} <ArrowRight className="size-3.5" />
          </Link>
        </Tile>
      </div>

      <Panel className="mt-4">
        <h2 className="font-semibold">{o.stepsTitle}</h2>
        <p className="text-sm text-muted-foreground">{o.stepsSub}</p>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={i} className={cn("flex flex-col rounded-2xl border p-4", s.done ? "border-brand/30 bg-brand-soft/30" : "border-border")}>
              <div className="flex items-center gap-2">
                <span className={cn("grid size-7 place-items-center rounded-full text-xs font-semibold", s.done ? "bg-brand text-white" : "bg-muted")}>
                  {s.done ? <Check className="size-4" /> : i + 1}
                </span>
                <p className="font-medium">{s.title}</p>
              </div>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{s.text}</p>
              <Link href={href(s.to)} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-strong hover:underline">
                {s.action} <ArrowRight className="size-3.5" />
              </Link>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel title={o.codeTitle} className="lg:col-span-3">
          <CodeBlock baseUrl={baseUrl} apiKey={KEY_PLACEHOLDER} />
          <p className="mt-2 text-xs text-muted-foreground">{dict.cab.code.keyHint}</p>
        </Panel>
        <Panel
          title={o.recentTitle}
          className="lg:col-span-2"
          action={
            <Link href={href("/dashboard/activity")} className="text-xs text-muted-foreground hover:text-foreground">
              {o.seeAll}
            </Link>
          }
        >
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{o.noRequests}</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate font-mono text-xs">
                      <span className="size-2 shrink-0 rounded-[2px]" style={{ background: modelColor(r.model) }} />
                      {r.model}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {date(r.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {r.source ?? dict.cab.activity.chat}
                    </p>
                  </div>
                  <span className={cn("tabular-nums", r.status >= 400 && "text-red-600")}>{r.status >= 400 ? r.status : money(r.costUsd)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
