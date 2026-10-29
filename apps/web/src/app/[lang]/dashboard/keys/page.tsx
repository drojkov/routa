import type { Metadata } from "next";
import { Keys } from "@/components/dashboard/keys";
import { loadLocale } from "@/i18n/server";
import { listKeys, requireUser } from "@/lib/account";
import { apiBase } from "@/lib/api-base";
import { monthStart, spendByKey } from "@/lib/usage";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/keys">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.cab.keys.title, robots: { index: false } };
}

export default async function KeysPage({ params, searchParams }: PageProps<"/[lang]/dashboard/keys">) {
  const { lang } = await loadLocale(params);
  const user = await requireUser(lang);
  const [keys, spend, sp] = await Promise.all([listKeys(user.id), spendByKey(user.id, monthStart()), searchParams]);
  return (
    <Keys
      baseUrl={await apiBase()}
      openCreate={sp.create === "1"}
      keys={keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        limitUsd: k.limitMicros == null ? null : k.limitMicros / 1_000_000,
        allowedModels: k.allowedModels ?? null,
        createdAt: k.createdAt.getTime(),
        lastUsedAt: k.lastUsedAt?.getTime() ?? null,
        disabled: !!k.disabledAt,
        blocked: !!k.blockedAt,
        revoked: !!k.revokedAt,
        spendUsd: (spend.get(k.id)?.costMicros ?? 0) / 1_000_000,
        requests: spend.get(k.id)?.requests ?? 0,
      }))}
    />
  );
}
