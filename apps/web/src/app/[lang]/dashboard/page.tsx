import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/dashboard";
import { loadLocale } from "@/i18n/server";
import { getBalanceMicros, getMonthSpendMicros, listKeys, listLedger, requireUser } from "@/lib/account";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.dashboard.metaTitle, robots: { index: false } };
}

export default async function DashboardPage({ params, searchParams }: PageProps<"/[lang]/dashboard">) {
  const { lang } = await loadLocale(params);
  const user = await requireUser(lang);
  const [balance, spent, keys, ledger, sp] = await Promise.all([
    getBalanceMicros(user.id),
    getMonthSpendMicros(user.id),
    listKeys(user.id),
    listLedger(user.id),
    searchParams,
  ]);
  const topup = Number(sp.topup);
  const method = typeof sp.method === "string" ? sp.method : undefined;

  return (
    <Dashboard
      user={{ name: user.name, email: user.email, image: user.image ?? null }}
      balanceUsd={balance / 1_000_000}
      spentUsd={spent / 1_000_000}
      keys={keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        limitUsd: k.limitMicros == null ? null : k.limitMicros / 1_000_000,
        createdAt: k.createdAt.getTime(),
        lastUsedAt: k.lastUsedAt?.getTime() ?? null,
        revoked: !!k.revokedAt,
      }))}
      ledger={ledger.map((l) => ({ id: l.id, kind: l.kind, usd: l.amountMicros / 1_000_000, at: l.createdAt.getTime() }))}
      initialTopUpUsd={Number.isFinite(topup) && topup > 0 ? topup : undefined}
      initialMethod={method}
    />
  );
}
