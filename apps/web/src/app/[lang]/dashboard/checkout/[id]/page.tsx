import { and, eq } from "drizzle-orm";
import { Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { Logo } from "@/components/site/nav";
import { db, schema } from "@/db";
import { formatMoney, isCurrency, localePath } from "@/i18n/config";
import { fmt } from "@/i18n/fmt";
import { loadLocale } from "@/i18n/server";
import { requireUser } from "@/lib/account";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/checkout/[id]">): Promise<Metadata> {
  const { dict } = await loadLocale(params);
  return { title: dict.dashboard.checkout.metaTitle, robots: { index: false } };
}

/**
 * Страница заказа. Сейчас — сводка и статус «ожидает оплаты».
 * На этапе чекаута здесь будет редирект/виджет провайдера оплаты.
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Logo />
          <LocaleSwitcher className="ml-auto" />
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-16">
        <div className="shadow-soft rounded-3xl border border-border bg-card p-6 md:p-8">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
            <Clock className="size-3.5" /> {c.pending}
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">{fmt(c.title, { id: `#${order.id.slice(0, 8).toUpperCase()}` })}</h1>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{c.toPay}</dt>
              <dd className="font-semibold tabular-nums">{toPay}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{c.toCredit}</dt>
              <dd className="font-semibold tabular-nums">{formatMoney(order.amountMicros / 1_000_000, "USD", lang)}</dd>
            </div>
          </dl>
          <p className="mt-6 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">{c.text}</p>
          <Link
            href={localePath(lang, "/dashboard")}
            className="mt-6 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background"
          >
            {c.back}
          </Link>
        </div>
      </main>
    </div>
  );
}
