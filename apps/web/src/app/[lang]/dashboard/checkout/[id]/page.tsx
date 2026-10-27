import { and, eq } from "drizzle-orm";
import { CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MerchantInfo } from "@/components/site/merchant-info";
import { db, schema } from "@/db";
import { formatMoney, isCurrency, localePath } from "@/i18n/config";
import { fmt } from "@/i18n/fmt";
import { loadLocale } from "@/i18n/server";
import { requireUser } from "@/lib/account";
import { demoPay } from "@/lib/actions/dashboard";
import { demoPaymentsEnabled } from "@/lib/payments";
import { BRAND } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/checkout/[id]">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.dashboard.checkout.metaTitle, robots: { index: false } };
}

/**
 * Страница заказа: сводка и статус. Провайдера оплаты пока нет — здесь будет его редирект/виджет.
 * До тех пор в dev заказ можно отметить оплаченным (демо-оплата, `lib/payments.ts`).
 */
export default async function CheckoutPage({ params }: PageProps<"/[lang]/dashboard/checkout/[id]">) {
  const { lang, dict } = await loadLocale(params);
  const { id } = await params;
  const user = await requireUser(lang);
  const order = await db.query.payment.findFirst({
    where: and(eq(schema.payment.id, id), eq(schema.payment.userId, user.id)),
  });
  if (!order) notFound();

  const c = dict.dashboard.checkout;
  const currency = isCurrency(order.currency) ? order.currency : "USD";
  const minor = currency === "JPY" ? 1 : 100;
  const toPay = new Intl.NumberFormat(lang, { style: "currency", currency }).format(order.amountMinor / minor);
  const paid = order.status === "paid";

  return (
    <div>
      <div className="mx-auto max-w-lg py-8">
        <div className="shadow-soft rounded-3xl border border-border bg-card p-6 md:p-8">
          {paid ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="size-3.5" /> {c.paid}
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
              <Clock className="size-3.5" /> {c.pending}
            </p>
          )}
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">{fmt(c.title, { id: `#${order.id.slice(0, 8).toUpperCase()}` })}</h1>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{c.item}</dt>
              <dd className="text-right">{fmt(c.description, { brand: BRAND })}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{c.orderDate}</dt>
              <dd className="tabular-nums">{new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(order.createdAt)} UTC</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{c.toPay}</dt>
              <dd className="font-semibold tabular-nums">{toPay}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{c.toCredit}</dt>
              <dd className="font-semibold tabular-nums">{formatMoney(order.amountMicros / 1_000_000, "USD", lang)}</dd>
            </div>
          </dl>
          <p className="mt-6 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">{paid ? c.paidText : c.text}</p>
          {!paid && order.status === "pending" && demoPaymentsEnabled() && (
            <form action={demoPay.bind(null, { id: order.id, lang })} className="mt-4 rounded-2xl border border-dashed border-border p-4">
              <p className="text-xs text-muted-foreground">{c.demoNote}</p>
              <button type="submit" className="mt-3 inline-flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium hover:bg-muted">
                {c.demoPay}
              </button>
            </form>
          )}
          <MerchantInfo className="mt-6 rounded-2xl border border-border p-4" />
          <Link
            href={localePath(lang, "/dashboard/billing")}
            className="mt-6 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background"
          >
            {c.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
