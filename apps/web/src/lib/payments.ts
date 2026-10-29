import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { en } from "@/i18n/dictionaries/en";
import { escapeHtml, sendEmail, siteUrl } from "@/lib/email";
import { BRAND, COMPANY } from "@/lib/site";

/**
 * Зачисляет оплаченный заказ: payment → paid и проводка topup в ledger, одной транзакцией.
 * Идемпотентно (ledger.ref = id заказа): повторный вебхук ничего не удвоит.
 * Эту функцию вызовет вебхук провайдера оплаты — после проверки подписи (SPEC §5 «Пополнение»).
 * После первого зачисления уходит письмо-подтверждение (Refund Policy §3.4).
 */
export function creditPayment(paymentId: string, provider: string, providerRef?: string) {
  const result = creditOnce(paymentId, provider, providerRef);
  if (result.ok && !result.already) void sendTopUpConfirmation(paymentId);
  return result;
}

function creditOnce(paymentId: string, provider: string, providerRef?: string) {
  return db.transaction((tx) => {
    const order = tx.select().from(schema.payment).where(eq(schema.payment.id, paymentId)).get();
    if (!order) return { ok: false as const, error: "not_found" as const };
    if (order.status === "paid") return { ok: true as const, already: true };
    // canceled — заказ, закрытый по сроку (db/index.ts): деньги пришли позже — всё равно зачисляем.
    if (order.status !== "pending" && order.status !== "canceled") return { ok: false as const, error: "not_pending" as const };

    tx.update(schema.payment)
      .set({ status: "paid", provider, providerRef: providerRef ?? null })
      .where(and(eq(schema.payment.id, paymentId), inArray(schema.payment.status, ["pending", "canceled"])))
      .run();
    tx.insert(schema.ledger)
      .values({ id: crypto.randomUUID(), userId: order.userId, kind: "topup", amountMicros: order.amountMicros, ref: paymentId })
      .onConflictDoNothing()
      .run();
    return { ok: true as const, already: false };
  });
}

/**
 * Подтверждение пополнения на «долговечном носителе» (email): сумма, зачисление, согласие на
 * немедленное начало услуги и информация о праве отзыва (CRD ст. 8(7), UK CCR рег. 16).
 * Юридические тексты у нас только на английском — письмо тоже.
 */
async function sendTopUpConfirmation(paymentId: string) {
  const row = await db
    .select({ payment: schema.payment, email: schema.user.email })
    .from(schema.payment)
    .innerJoin(schema.user, eq(schema.user.id, schema.payment.userId))
    .where(eq(schema.payment.id, paymentId))
    .get();
  if (!row) return;
  const { payment: p, email } = row;
  const minor = p.currency === "JPY" ? 1 : 100;
  const paid = `${p.currency} ${(p.amountMinor / minor).toFixed(minor === 1 ? 0 : 2)}`;
  const credited = `USD ${(p.amountMicros / 1_000_000).toFixed(2)}`;
  const date = p.updatedAt.toUTCString();
  const site = siteUrl();
  const refunds = `${site}/en/legal/refunds`;
  const terms = `${site}/en/legal/terms`;
  const waiver = en.dashboard.topup.waiver;
  const seller = `${COMPANY.legalName}, registration number ${COMPANY.crNumber}, ${COMPANY.address}`;

  const text = [
    `Thank you. We have received your payment and topped up your ${BRAND} balance.`,
    "",
    `Amount paid: ${paid}`,
    `Credited to your balance: ${credited}`,
    `Order ID: ${p.id}`,
    `Date: ${date}`,
    "",
    "Your request to start immediately",
    `When you topped up, you confirmed: "${waiver}"`,
    "",
    "Right of withdrawal (consumers in the EU, EEA and UK)",
    `You may withdraw from this top-up within 14 days of payment without giving a reason. To withdraw, email ${COMPANY.email} or write to ${COMPANY.legalName}, ${COMPANY.address}, with the order ID above. We refund the amount you paid, less any amount the law allows us to charge for service already provided, within 14 days of your notice, to the original payment method. Details: ${refunds}`,
    "",
    `You can also ask for a refund of your unused paid balance at any time under our Refund Policy: ${refunds}`,
    `Terms of Service: ${terms}`,
    "",
    `Seller: ${seller}. Questions: ${COMPANY.email}`,
  ].join("\n");

  const h = escapeHtml;
  const link = (url: string, label: string) => `<a href="${h(url)}">${h(label)}</a>`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111;max-width:560px">
<p>Thank you. We have received your payment and topped up your ${h(BRAND)} balance.</p>
<table style="border-collapse:collapse">
<tr><td style="padding:2px 16px 2px 0;color:#666">Amount paid</td><td>${h(paid)}</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#666">Credited to your balance</td><td><b>${h(credited)}</b></td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#666">Order ID</td><td>${h(p.id)}</td></tr>
<tr><td style="padding:2px 16px 2px 0;color:#666">Date</td><td>${h(date)}</td></tr>
</table>
<h3 style="font-size:14px;margin:20px 0 4px">Your request to start immediately</h3>
<p style="margin:0">When you topped up, you confirmed: “${h(waiver)}”</p>
<h3 style="font-size:14px;margin:20px 0 4px">Right of withdrawal (consumers in the EU, EEA and UK)</h3>
<p style="margin:0">You may withdraw from this top-up within 14 days of payment without giving a reason. To withdraw, email ${link(`mailto:${COMPANY.email}`, COMPANY.email)} or write to ${h(COMPANY.legalName)}, ${h(COMPANY.address)}, with the order ID above. We refund the amount you paid, less any amount the law allows us to charge for service already provided, within 14 days of your notice, to the original payment method. ${link(refunds, "Refund Policy")}.</p>
<p>You can also ask for a refund of your unused paid balance at any time. ${link(terms, "Terms of Service")}.</p>
<p style="color:#666;font-size:12px">Seller: ${h(seller)}. Questions: ${h(COMPANY.email)}</p>
</div>`;

  await sendEmail({ to: email, subject: `${BRAND}: payment received, ${credited} added to your balance`, text, html });
}

/**
 * Демо-оплата: пока провайдера нет, заказ можно отметить оплаченным кнопкой на странице заказа.
 * Вне production включена по умолчанию, в production — только с PAYMENTS_DEMO=true.
 */
export function demoPaymentsEnabled() {
  const flag = process.env.PAYMENTS_DEMO;
  if (flag) return flag === "true";
  return process.env.NODE_ENV !== "production";
}

/** Запрос счёта для компании (Terms §5.2): письмо в поддержку. Счёт выставляется вручную, оплату отмечает `npm run account invoice-paid`. */
export async function notifyInvoiceRequest(input: { id: string; email: string; usd: number; details: string }) {
  const ref = input.id.slice(0, 8).toUpperCase();
  const amount = `USD ${input.usd.toFixed(2)}`;
  const text = `Invoice requested for order #${ref} (${input.id})\nAccount: ${input.email}\nAmount: ${amount}\n\nBilling details:\n${input.details}\n\nAfter payment is received: npm run account invoice-paid ${input.id}`;
  await sendEmail({
    to: COMPANY.email,
    subject: `[invoice] #${ref} ${amount} — ${input.email}`,
    text,
    html: `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
  });
}
