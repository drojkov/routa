"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/provider";
import { MODELS } from "@/lib/site";
import { snippet, SNIPPET_LABELS, SNIPPET_LANGS, type SnippetLang } from "@/lib/snippets";
import { cn } from "@/lib/utils";

/** Общие блоки кабинета. */

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  id,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={cn("shadow-soft scroll-mt-20 rounded-3xl border border-border bg-card p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Tile({
  icon: Icon,
  label,
  value,
  note,
  accent,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note?: React.ReactNode;
  accent?: boolean;
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
        {note && <div className="mt-1 truncate text-xs text-muted-foreground">{note}</div>}
        {children}
      </div>
    </div>
  );
}

export function CopyButton({ text, className, label }: { text: string; className?: string; label?: string }) {
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
      className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition hover:bg-muted", className)}
    >
      {ok ? <Check className="size-3.5 text-brand-strong" /> : <Copy className="size-3.5" />}
      {ok ? dict.cab.code.copied : (label ?? dict.cab.code.copy)}
    </button>
  );
}

/** Выбор модели: доступные сверху, недоступные — отключены с пометкой. */
export function ModelSelect({
  value,
  onChange,
  className,
  onlyAvailable,
}: {
  value: string;
  onChange: (id: string) => void;
  className?: string;
  onlyAvailable?: boolean;
}) {
  const { dict } = useI18n();
  const list = [...MODELS].sort((a, b) => Number(b.available) - Number(a.available));
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 rounded-xl border border-border bg-background px-3 font-mono text-xs outline-none focus:border-brand focus:ring-3 focus:ring-brand/20",
        className,
      )}
    >
      {list
        .filter((m) => !onlyAvailable || m.available)
        .map((m) => (
          <option key={m.id} value={m.id} disabled={!m.available}>
            {m.id}
            {m.available ? "" : ` — ${dict.cab.chat.soon}`}
          </option>
        ))}
    </select>
  );
}

/** Готовый пример запроса: вкладки cURL / Python / JS, выбор модели, копирование. */
export function CodeBlock({
  baseUrl,
  apiKey,
  model: initialModel,
  pickModel = true,
  className,
}: {
  baseUrl: string;
  apiKey: string;
  model?: string;
  pickModel?: boolean;
  className?: string;
}) {
  const [lang, setLang] = React.useState<SnippetLang>("curl");
  const [model, setModel] = React.useState(initialModel ?? MODELS.find((m) => m.available)?.id ?? MODELS[0].id);
  const code = snippet(lang, { baseUrl, apiKey, model });
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-[#111] text-white", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-2 py-2">
        <div className="flex gap-1">
          {SNIPPET_LANGS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={cn("rounded-lg px-2.5 py-1 text-xs transition", lang === l ? "bg-white/15 text-white" : "text-white/55 hover:text-white")}
            >
              {SNIPPET_LABELS[l]}
            </button>
          ))}
        </div>
        {pickModel && (
          <ModelSelect value={model} onChange={setModel} onlyAvailable className="ml-auto h-8 border-white/15 bg-white/5 text-white" />
        )}
        <CopyButton text={code} className={cn("text-white/80 hover:bg-white/10", !pickModel && "ml-auto")} />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-white/85">{code}</pre>
    </div>
  );
}
