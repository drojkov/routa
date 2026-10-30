import "server-only";
import { and, eq, gte, inArray, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { escapeHtml, sendEmail } from "@/lib/email";
import { refundableMicrosTx } from "@/lib/refunds";
import { BRAND, COMPANY } from "@/lib/site";

/**
 * Отзыв пополнения в 14 дней — Refund Policy §3, функция отзыва по ст. 11a Директивы 2011/83/EU
 * (в редакции Директивы 2023/2673): кнопка «Withdraw from contract» → подтверждение → письмо
 * с подтверждением получения (durable medium) с датой и временем.
 *
 * Заявка хранится в refund_request (kind = 'withdrawal', paymentId). На время разбора замораживается
 * min(сумма пополнения, неиспользованный оплаченный баланс) — проводка refund, ref `refund:<id>`,
 * как у обычного возврата, поэтому одобрение и отказ — тем же `npm run refund approve|reject`.
 * Сколько вернуть (сумма пополнения минус оплата уже оказанной услуги, если закон это позволяет), решает поддержка.
 */
export const WITHDRAWAL_DAYS = 14;
const WINDOW_MS = WITHDRAWAL_DAYS * 86_400_000;

export type Withdrawable = { paymentId: string; paidAt: Date; amountMicros: number; currency: string; amountMinor: number };

/** Пополнения картой или кошельком, оплаченные меньше 14 дней назад и ещё не отозванные. Счета компаний — не потребительские. */
export function listWithdrawable(userId: string): Withdrawable[] {
  const since = new Date(Date.now() - WINDOW_MS);
  const rows = db
    .select({
      paymentId: schema.payment.id,
      paidAt: schema.ledger.createdAt,
      amountMicros: schema.payment.amountMicros,
      currency: schema.payment.currency,
      amountMinor: schema.payment.amountMinor,
    })
    .from(schema.payment)
    .innerJoin(schema.ledger, and(eq(schema.ledger.ref, schema.payment.id), eq(schema.ledger.kind, "topup")))
    .where(
      and(
        eq(schema.payment.userId, userId),
        eq(schema.payment.status, "paid"),
        inArray(schema.payment.method, ["card", "wallet"]),
        gte(schema.ledger.createdAt, since),
      ),
    )
    .all();
  const taken = new Set(
    db
      .select({ paymentId: schema.refundRequest.paymentId })
      .from(schema.refundRequest)
      .where(and(eq(schema.refundRequest.userId, userId), eq(schema.refundRequest.kind, "withdrawal"), ne(schema.refundRequest.status, "rejected")))
      .all()
      .map((r) => r.paymentId),
  );
  return rows.filter((r) => !taken.has(r.paymentId)).sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());
}

export type WithdrawalResult =
  | { ok: true; id: string; heldMicros: number; at: Date; order: Withdrawable }
  | { ok: false; error: "not_found" | "expired" };

export function createWithdrawal(userId: string, paymentId: string, name: string, ipAddress: string | null): WithdrawalResult {
  return db.transaction((tx) => {
    const order = listWithdrawable(userId).find((o) => o.paymentId === paymentId);
    if (!order) {
      // Отличаем «уже прошло 14 дней» от «нет такого пополнения или уже отозвано» — для понятного сообщения.
      const exists = tx
        .select({ id: schema.payment.id })
        .from(schema.payment)
        .where(and(eq(schema.payment.id, paymentId), eq(schema.payment.userId, userId), eq(schema.payment.status, "paid")))
        .get();
      return { ok: false as const, error: exists ? ("expired" as const) : ("not_found" as const) };
    }
    const held = Math.min(order.amountMicros, refundableMicrosTx(tx, userId));
    const id = crypto.randomUUID();
    const at = new Date();
    const reason = `Withdrawal from top-up #${ref(paymentId)} (14-day right of withdrawal). Name: ${name}`;
    tx.insert(schema.refundRequest)
      .values({ id, userId, kind: "withdrawal", paymentId, amountMicros: held, reason, ipAddress, createdAt: at, updatedAt: at })
      .run();
    if (held > 0) {
      tx.insert(schema.ledger)
        .values({ id: crypto.randomUUID(), userId, kind: "refund", amountMicros: -held, ref: `refund:${id}`, note: "Withdrawal requested" })
        .run();
    }
    return { ok: true as const, id, heldMicros: held, at, order };
  });
}

const ref = (id: string) => id.slice(0, 8).toUpperCase();

function paidText(o: Withdrawable) {
  const minor = o.currency === "JPY" ? 1 : 100;
  return new Intl.NumberFormat("en", { style: "currency", currency: o.currency }).format(o.amountMinor / minor);
}

/** Подтверждение получения клиенту (обязательно, «без промедления, на долговечном носителе») и письмо поддержке. */
export async function notifyWithdrawal(input: { id: string; email: string; name: string; res: Extract<WithdrawalResult, { ok: true }> }) {
  const { res } = input;
  const o = res.order;
  const when = `${res.at.toUTCString()}`;
  const text = [
    `We have received your notice of withdrawal.`,
    "",
    `Received: ${when}`,
    `Name: ${input.name}`,
    `Account email: ${input.email}`,
    `Contract: ${BRAND} balance top-up #${ref(o.paymentId)}, paid ${o.paidAt.toUTCString()}, amount paid ${paidText(o)} (USD ${(o.amountMicros / 1_000_000).toFixed(2)} credited)`,
    `Withdrawal reference: #${ref(input.id)}`,
    "",
    `We will refund the amount you paid for this top-up, less any amount the law allows us to charge for service already provided, without undue delay and within ${WITHDRAWAL_DAYS} days of receiving this notice, to the original payment method. We do not charge a fee for the refund.`,
    res.heldMicros > 0 ? `USD ${(res.heldMicros / 1_000_000).toFixed(2)} of your balance is on hold until the refund is made.` : "",
    "",
    `Questions: ${COMPANY.email}. ${COMPANY.legalName}, ${COMPANY.address}.`,
  ]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");
  await sendEmail({
    to: input.email,
    subject: `${BRAND}: withdrawal received — top-up #${ref(o.paymentId)}`,
    text,
    html: `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111;max-width:560px">${text
      .split("\n\n")
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
      .join("")}</div>`,
  });
  await sendEmail({
    to: COMPANY.email,
    subject: `[withdrawal] #${ref(input.id)} top-up #${ref(o.paymentId)} — ${input.email}`,
    text: `14-day withdrawal (refund within 14 days of ${when}).\nRequest: ${input.id}\nPayment: ${o.paymentId}\nAccount: ${input.email} (${input.name})\nPaid: ${paidText(o)}\nHeld: USD ${(res.heldMicros / 1_000_000).toFixed(2)}\n\nRefund at the payment provider, then: npm run refund approve ${input.id} [usd]`,
    html: `<pre>${escapeHtml(`14-day withdrawal\nRequest: ${input.id}\nPayment: ${o.paymentId}\nAccount: ${input.email} (${input.name})\nPaid: ${paidText(o)}\nHeld: USD ${(res.heldMicros / 1_000_000).toFixed(2)}`)}</pre>`,
  });
}
