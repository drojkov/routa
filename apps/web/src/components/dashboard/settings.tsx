"use client";

import { Check, Download, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useI18n } from "@/i18n/provider";
import { closeMyAccount, deleteRequestContent, setLogContent } from "@/lib/actions/dashboard";
import { cn } from "@/lib/utils";
import { PageTitle, Panel } from "./ui";

type Logging = { enabled: boolean; retentionDays: number };

export function Settings({ user, logging }: { user: { name: string; email: string }; logging: Logging }) {
  const { dict } = useI18n();
  const s = dict.cab.settings;
  return (
    <div>
      <PageTitle title={s.title} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={s.profile}>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">{s.name}</dt>
              <dd className="mt-0.5">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{s.email}</dt>
              <dd className="mt-0.5">{user.email}</dd>
            </div>
          </dl>
        </Panel>
        <Privacy />
        <RequestLogging {...logging} />
      </div>
    </div>
  );
}

/* ——— Данные и закрытие аккаунта (Privacy §9, Terms §11.1) ——— */
function Privacy() {
  const { dict, locale } = useI18n();
  const s = dict.dashboard.settings;
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
              try {
                await closeMyAccount(locale);
              } catch (e) {
                // redirect() из server action приходит сюда как исключение — это успех.
                if (e && typeof e === "object" && "digest" in e && String(e.digest).startsWith("NEXT_REDIRECT")) throw e;
                setBusy(false);
                alert(dict.auth.errors.generic);
              }
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

/* ——— Логирование текстов запросов (Terms §7.4, Privacy §3) ——— */
function RequestLogging({ enabled, retentionDays }: Logging) {
  const { dict, t } = useI18n();
  const l = dict.cab.settings.logging;
  const router = useRouter();
  const [on, setOn] = React.useState(enabled);
  const [pending, startTransition] = React.useTransition();
  const [deleted, setDeleted] = React.useState(false);

  const toggle = () => {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      await setLogContent(next);
      router.refresh();
    });
  };

  return (
    <Panel title={l.title}>
      <div className="space-y-4 text-sm">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="font-medium">{l.toggle}</span>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            disabled={pending}
            onClick={toggle}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60",
              on ? "bg-brand" : "bg-muted-foreground/30",
            )}
          >
            <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", on && "translate-x-5")} />
          </button>
        </label>
        <p className="text-muted-foreground">{l.text}</p>
        <p className="text-muted-foreground">
          {t(l.retention, { days: retentionDays })} {l.offNote}
        </p>
        <button
          type="button"
          onClick={() => {
            if (!confirm(l.deleteConfirm)) return;
            startTransition(async () => {
              await deleteRequestContent();
              setDeleted(true);
            });
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium transition hover:bg-muted"
        >
          {deleted ? <Check className="size-4" /> : <Trash2 className="size-4" />}
          {deleted ? l.deleted : l.delete}
        </button>
      </div>
    </Panel>
  );
}
