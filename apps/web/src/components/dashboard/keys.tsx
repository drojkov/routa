"use client";

import { KeyRound, Loader2, MessageSquare, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { USD_RATES } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { createApiKey, revokeApiKey, updateApiKey } from "@/lib/actions/dashboard";
import { MODELS } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CodeBlock, CopyButton, PageTitle, Panel } from "./ui";

export type KeyRow = {
  id: string;
  name: string;
  prefix: string;
  limitUsd: number | null;
  allowedModels: string[] | null;
  createdAt: number;
  lastUsedAt: number | null;
  disabled: boolean;
  revoked: boolean;
  spendUsd: number;
  requests: number;
};

const inputCls =
  "mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-3 focus:ring-brand/20";

export function Keys({ keys, baseUrl, openCreate }: { keys: KeyRow[]; baseUrl: string; openCreate?: boolean }) {
  const { dict, t } = useI18n();
  const k = dict.cab.keys;
  const [creating, setCreating] = React.useState(!!openCreate);
  const [created, setCreated] = React.useState<{ key: string; model?: string } | null>(null);
  const [showRevoked, setShowRevoked] = React.useState(false);
  const active = keys.filter((x) => !x.revoked);
  const revoked = keys.filter((x) => x.revoked);

  return (
    <div>
      <PageTitle
        title={k.title}
        sub={k.sub}
        action={
          !creating && (
            <button
              type="button"
              onClick={() => {
                setCreating(true);
                setCreated(null);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-white shadow-[0_8px_20px_-8px_var(--brand)] transition hover:bg-brand-strong"
            >
              <Plus className="size-4" /> {k.create}
            </button>
          )
        }
      />

      {created && <KeyReady plain={created.key} model={created.model} baseUrl={baseUrl} onDone={() => setCreated(null)} />}

      {creating && (
        <Panel title={k.create} className="mb-4">
          <KeyForm
            submitLabel={k.create}
            pendingLabel={k.creating}
            onCancel={() => setCreating(false)}
            onSubmit={async (v) => {
              const res = await createApiKey(v);
              if (!res.ok) return res.error === "too_many" ? "generic" : res.error;
              setCreated({ key: res.key, model: v.allowedModels?.[0] });
              setCreating(false);
              return null;
            }}
          />
        </Panel>
      )}

      <Panel>
        {active.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{k.none}</p>
        ) : (
          <ul className="divide-y divide-border">
            {active.map((key) => (
              <KeyItem key={key.id} k={key} />
            ))}
          </ul>
        )}
        {revoked.length > 0 && (
          <div className="mt-3 border-t border-border pt-3">
            <button type="button" onClick={() => setShowRevoked((v) => !v)} className="text-xs text-muted-foreground underline underline-offset-2">
              {showRevoked ? k.hideRevoked : t(k.showRevoked, { n: revoked.length })}
            </button>
            {showRevoked && (
              <ul className="mt-2 divide-y divide-border opacity-60">
                {revoked.map((key) => (
                  <li key={key.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <KeyRound className="size-4 text-muted-foreground" />
                    <span className="font-medium">{key.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{key.prefix}</span>
                    <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs">{k.revoked}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

/** Экран после создания: ключ один раз + готовый код с этим ключом. */
export function KeyReady({ plain, model, baseUrl, onDone }: { plain: string; model?: string; baseUrl: string; onDone: () => void }) {
  const { dict, href } = useI18n();
  const k = dict.cab.keys;
  return (
    <div className="mb-4 rounded-3xl border border-brand/40 bg-brand-soft/40 p-5">
      <p className="font-semibold">{k.readyTitle}</p>
      <p className="mt-1 text-sm text-muted-foreground">{k.readyText}</p>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-card p-2 pl-3 shadow-soft">
        <code className="min-w-0 flex-1 truncate font-mono text-sm">{plain}</code>
        <CopyButton text={plain} className="bg-foreground text-background hover:bg-foreground/85" />
      </div>
      <CodeBlock baseUrl={baseUrl} apiKey={plain} model={model} className="mt-4" />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onDone} className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-medium text-background">
          {k.done}
        </button>
        <Link href={href("/dashboard/chat")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <MessageSquare className="size-4" /> {dict.cab.overview.step3Action}
        </Link>
      </div>
    </div>
  );
}

type FormValues = { name: string; limit: string; currency: string; allowedModels: string[] | null };

function KeyForm({
  initial,
  submitLabel,
  pendingLabel,
  onSubmit,
  onCancel,
}: {
  initial?: { name: string; limitUsd: number | null; allowedModels: string[] | null };
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (v: FormValues) => Promise<string | null>;
  onCancel: () => void;
}) {
  const { dict, t, currency } = useI18n();
  const k = dict.cab.keys;
  const [name, setName] = React.useState(initial?.name ?? "");
  // Лимит хранится в USD, в форме — в валюте показа.
  const [limit, setLimit] = React.useState(initial?.limitUsd != null ? String(Math.round(initial.limitUsd * USD_RATES[currency] * 100) / 100) : "");
  const [restrict, setRestrict] = React.useState(!!initial?.allowedModels);
  const [models, setModels] = React.useState<string[]>(initial?.allowedModels ?? []);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const err = await onSubmit({ name, limit, currency, allowedModels: restrict ? models : null });
          setError(err ? (k.errors[err as keyof typeof k.errors] ?? k.errors.generic) : null);
        });
      }}
      className="space-y-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-muted-foreground">
          {k.name}
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} autoFocus placeholder={k.namePlaceholder} className={inputCls} />
        </label>
        <label className="text-xs text-muted-foreground">
          {t(k.limit, { currency })}
          <input
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            inputMode="decimal"
            placeholder={k.limitHint}
            className={inputCls}
          />
        </label>
      </div>

      <div>
        <p className="text-xs text-muted-foreground">{k.models}</p>
        <div className="mt-1.5 flex gap-2 text-sm">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setRestrict(v)}
              className={cn("rounded-xl border px-3 py-1.5 transition", restrict === v ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted")}
            >
              {v ? k.selectModels : k.allModels}
            </button>
          ))}
        </div>
        {restrict && (
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {MODELS.map((m) => (
              <label key={m.id} className={cn("flex items-center gap-2 rounded-lg px-2 py-1 text-sm", !m.available && "opacity-50")}>
                <input
                  type="checkbox"
                  checked={models.includes(m.id)}
                  onChange={(e) => setModels((list) => (e.target.checked ? [...list, m.id] : list.filter((x) => x !== m.id)))}
                  className="accent-[var(--brand)]"
                />
                <span className="font-mono text-xs">{m.id}</span>
                {!m.available && <span className="text-[10px] text-muted-foreground">{dict.cab.chat.soon}</span>}
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-foreground px-4 text-sm font-medium text-background disabled:opacity-70">
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? pendingLabel : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="h-10 rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted">
          {k.cancel}
        </button>
      </div>
    </form>
  );
}

function KeyItem({ k: key }: { k: KeyRow }) {
  const { dict, money, t, date } = useI18n();
  const k = dict.cab.keys;
  const [editing, setEditing] = React.useState(false);
  const [pending, start] = React.useTransition();
  const pct = key.limitUsd ? Math.min(100, (key.spendUsd / key.limitUsd) * 100) : 0;

  if (editing) {
    return (
      <li className="py-4">
        <KeyForm
          initial={key}
          submitLabel={k.save}
          pendingLabel={k.saving}
          onCancel={() => setEditing(false)}
          onSubmit={async (v) => {
            const res = await updateApiKey({ id: key.id, ...v });
            if (!res.ok) return res.error;
            setEditing(false);
            return null;
          }}
        />
      </li>
    );
  }

  return (
    <li className={cn("grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center", key.disabled && "opacity-70")}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <KeyRound className="size-4 text-muted-foreground" />
          <span className="font-medium">{key.name}</span>
          <span className="font-mono text-xs text-muted-foreground">{key.prefix}</span>
          {key.disabled && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">{k.disabled}</span>}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{key.limitUsd != null ? t(k.ofLimit, { spent: money(key.spendUsd), limit: money(key.limitUsd) }) : t(k.spendMonth, { amount: money(key.spendUsd) })}</span>
          <span>{t(k.requests, { n: key.requests })}</span>
          <span>{key.allowedModels ? t(k.someModels, { n: key.allowedModels.length, total: MODELS.length }) : k.allModels}</span>
          <span>{key.lastUsedAt ? t(k.lastUsed, { date: date(key.lastUsedAt) }) : k.neverUsed}</span>
          <span>{t(k.created, { date: date(key.createdAt) })}</span>
        </div>
        {key.limitUsd != null && (
          <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", pct >= 90 ? "bg-red-500" : "bg-brand")} style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <ActionBtn onClick={() => setEditing(true)} icon={Pencil} label={k.edit} />
        <ActionBtn
          onClick={() => start(async () => void (await updateApiKey({ id: key.id, disabled: !key.disabled })))}
          icon={pending ? Loader2 : key.disabled ? Play : Pause}
          label={key.disabled ? k.enable : k.disable}
          spin={pending}
        />
        <ActionBtn
          onClick={() => {
            if (confirm(k.revokeConfirm)) start(() => revokeApiKey(key.id));
          }}
          icon={Trash2}
          label={k.revoke}
          danger
        />
      </div>
    </li>
  );
}

function ActionBtn({
  onClick,
  icon: Icon,
  label,
  danger,
  spin,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  danger?: boolean;
  spin?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition",
        danger ? "text-red-600 hover:bg-red-50" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className={cn("size-3.5", spin && "animate-spin")} /> {label}
    </button>
  );
}
