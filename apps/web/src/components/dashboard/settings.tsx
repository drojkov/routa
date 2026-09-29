"use client";

import { Download, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { PageTitle, Panel } from "./ui";

export function Settings({ user }: { user: { name: string; email: string } }) {
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
      </div>
    </div>
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
