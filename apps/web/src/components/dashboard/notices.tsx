"use client";

import { Info, X } from "lucide-react";
import * as React from "react";
import { useI18n } from "@/i18n/provider";
import { dismissNotice } from "@/lib/actions/dashboard";

export type NoticeItem = { id: string; title: string; body: string; createdAt: number };

/** Уведомления от поддержки (Terms §17, §19) — над содержимым любой вкладки кабинета. Текст — как ввела поддержка (EN). */
export function Notices({ notices }: { notices: NoticeItem[] }) {
  const { dict, date } = useI18n();
  const n = dict.cab.notices;
  const [hidden, setHidden] = React.useState<string[]>([]);
  const [, start] = React.useTransition();
  const visible = notices.filter((x) => !hidden.includes(x.id));
  if (!visible.length) return null;
  return (
    <section aria-label={n.label} className="mb-6 space-y-2">
      {visible.map((x) => (
        <div key={x.id} role="status" className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          <Info className="mt-0.5 size-4 shrink-0 text-sky-600" />
          <div className="min-w-0 flex-1" lang="en">
            <p className="font-medium">
              {x.title} <span className="ml-1 text-xs font-normal text-sky-800/70">{date(x.createdAt, { day: "numeric", month: "short", year: "numeric" })}</span>
            </p>
            {x.body.split(/\n\s*\n/).map((p, i) => (
              <p key={i} className="mt-1 whitespace-pre-line text-sky-900/90">
                {p}
              </p>
            ))}
          </div>
          <button
            type="button"
            title={n.dismiss}
            aria-label={n.dismiss}
            onClick={() => {
              setHidden((h) => [...h, x.id]);
              start(async () => void (await dismissNotice(x.id)));
            }}
            className="-mt-1 -mr-2 grid size-7 shrink-0 place-items-center rounded-lg text-sky-700 transition hover:bg-sky-100"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </section>
  );
}
