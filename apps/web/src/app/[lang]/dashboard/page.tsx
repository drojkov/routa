import type { Metadata } from "next";
import { Overview } from "@/components/dashboard/overview";
import { loadLocale } from "@/i18n/server";
import { getBalanceMicros, listKeys, requireUser } from "@/lib/account";
import { apiBase } from "@/lib/api-base";
import { listRequests, monthStart, usageSummary } from "@/lib/usage";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.dashboard.metaTitle, robots: { index: false } };
}

export default async function DashboardPage({ params }: PageProps<"/[lang]/dashboard">) {
  const { lang } = await loadLocale(params);
  const user = await requireUser(lang);
  const [balance, month, keys, recent] = await Promise.all([
    getBalanceMicros(user.id),
    usageSummary(user.id, monthStart()),
    listKeys(user.id),
    listRequests(user.id, {}, 6),
  ]);
  return (
    <Overview
      name={user.name}
      balanceUsd={balance / 1_000_000}
      monthUsd={month.costMicros / 1_000_000}
      monthRequests={month.requests}
      activeKeys={keys.filter((k) => !k.revokedAt).length}
      baseUrl={await apiBase()}
      recent={recent.map((r) => ({
        id: r.id,
        at: r.createdAt.getTime(),
        model: r.model,
        source: r.apiKeyId ? (r.keyName ?? "—") : null,
        costUsd: r.costMicros / 1_000_000,
        status: r.status,
      }))}
    />
  );
}
