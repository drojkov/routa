import type { Metadata } from "next";
import { Billing } from "@/components/dashboard/billing";
import { loadLocale } from "@/i18n/server";
import { listLedger, requireUser } from "@/lib/account";
import { parseTopUpUsd } from "@/lib/billing";
import { getRefundableMicros, listRefundRequests } from "@/lib/refunds";
import { listPayments } from "@/lib/usage";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/billing">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.cab.billing.title, robots: { index: false } };
}

export default async function BillingPage({ params, searchParams }: PageProps<"/[lang]/dashboard/billing">) {
  const { lang } = await loadLocale(params);
  const user = await requireUser(lang);
  const [ledger, orders, refunds, sp] = await Promise.all([listLedger(user.id, 200), listPayments(user.id), listRefundRequests(user.id), searchParams]);
  const topup = typeof sp.topup === "string" ? parseTopUpUsd(sp.topup) : null;
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
      refunds={refunds.map((r) => ({ id: r.id, usd: r.amountMicros / 1_000_000, status: r.status, at: r.createdAt.getTime(), note: r.decisionNote }))}
      refundableUsd={getRefundableMicros(user.id) / 1_000_000}
      email={user.email}
      emailVerified={user.emailVerified}
      justVerified={sp.verified === "1"}
      initialTopUpUsd={topup ?? undefined}
      initialMethod={typeof sp.method === "string" ? sp.method : undefined}
    />
  );
}
