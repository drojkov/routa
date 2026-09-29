import type { Metadata } from "next";
import { Billing } from "@/components/dashboard/billing";
import { loadLocale } from "@/i18n/server";
import { listLedger, requireUser } from "@/lib/account";
import { listPayments } from "@/lib/usage";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/billing">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.cab.billing.title, robots: { index: false } };
}

export default async function BillingPage({ params, searchParams }: PageProps<"/[lang]/dashboard/billing">) {
  const { lang } = await loadLocale(params);
  const user = await requireUser(lang);
  const [ledger, orders, sp] = await Promise.all([listLedger(user.id, 200), listPayments(user.id), searchParams]);
  const topup = Number(sp.topup);
  return (
    <Billing
      ledger={ledger.map((l) => ({ id: l.id, kind: l.kind, usd: l.amountMicros / 1_000_000, at: l.createdAt.getTime(), note: l.note }))}
      orders={orders.map((o) => ({
        id: o.id,
        status: o.status,
        usd: o.amountMicros / 1_000_000,
        at: o.createdAt.getTime(),
        currency: o.currency,
        amountMinor: o.amountMinor,
      }))}
      initialTopUpUsd={Number.isFinite(topup) && topup > 0 ? topup : undefined}
      initialMethod={typeof sp.method === "string" ? sp.method : undefined}
    />
  );
}
