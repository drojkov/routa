import "server-only";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { escapeHtml, sendEmail } from "@/lib/email";
import { BRAND, COMPANY } from "@/lib/site";

/**
 * Возврат неиспользованного оплаченного баланса (Refund Policy §2).
 *
 * Возвращается только оплаченное: бонус при регистрации денег не стоит. Считаем, что бонус тратится
 * первым, поэтому к возврату — min(баланс, пополнения − уже возвращённое/замороженное).
 * Заявка сразу замораживает сумму проводкой refund (ref `refund:<id>`), чтобы её нельзя было
 * потратить, пока поддержка проверяет заявку. Отклонение — проводка adjust (ref `refund-release:<id>`),
 * см. scripts/refund.mjs.
 */
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const sumWhere = (tx: Tx, where: ReturnType<typeof and>) =>
  Number(
    tx
      .select({ v: sql<number>`coalesce(sum(${schema.ledger.amountMicros}), 0)` })
      .from(schema.ledger)
      .where(where)
      .get()?.v ?? 0,
  );

export function refundableMicrosTx(tx: Tx, userId: string) {
  const u = eq(schema.ledger.userId, userId);
  const balance = sumWhere(tx, and(u));
  const paid = sumWhere(tx, and(u, eq(schema.ledger.kind, "topup")));
  const refunded = sumWhere(tx, and(u, eq(schema.ledger.kind, "refund"))); // отрицательное
  // Возвращённые на баланс: отклонённые заявки и исправления ошибок списания (scripts/account.mjs credit).
  const released = sumWhere(
    tx,
    and(u, eq(schema.ledger.kind, "adjust"), or(like(schema.ledger.ref, "refund-release:%"), like(schema.ledger.ref, "correction:%"))),
  );
  return Math.max(0, Math.min(balance, paid + refunded + released));
}

export function getRefundableMicros(userId: string) {
  return db.transaction((tx) => refundableMicrosTx(tx, userId));
}

export function listRefundRequests(userId: string) {
  return db
    .select({
      id: schema.refundRequest.id,
      amountMicros: schema.refundRequest.amountMicros,
      status: schema.refundRequest.status,
      createdAt: schema.refundRequest.createdAt,
    })
    .from(schema.refundRequest)
    .where(eq(schema.refundRequest.userId, userId))
    .orderBy(desc(schema.refundRequest.createdAt))
    .limit(20);
}

/** Минимальная сумма заявки — 1 цент. */
const MIN_REFUND_MICROS = 10_000;

export type RefundResult = { ok: true; id: string; amountMicros: number } | { ok: false; error: "nothing" | "pending" };

export function createRefundRequest(userId: string, reason: string | null, ipAddress: string | null): RefundResult {
  return db.transaction((tx) => {
    const pending = tx
      .select({ id: schema.refundRequest.id })
      .from(schema.refundRequest)
      .where(and(eq(schema.refundRequest.userId, userId), eq(schema.refundRequest.status, "pending")))
      .get();
    if (pending) return { ok: false as const, error: "pending" as const };
    const amount = refundableMicrosTx(tx, userId);
    if (amount < MIN_REFUND_MICROS) return { ok: false as const, error: "nothing" as const };
    const id = crypto.randomUUID();
    tx.insert(schema.refundRequest).values({ id, userId, amountMicros: amount, reason, ipAddress }).run();
    tx.insert(schema.ledger)
      .values({ id: crypto.randomUUID(), userId, kind: "refund", amountMicros: -amount, ref: `refund:${id}`, note: "Refund requested" })
      .run();
    return { ok: true as const, id, amountMicros: amount };
  });
}

/** Письма: поддержке — заявка в работу, клиенту — подтверждение получения (Refund Policy §2). */
export async function notifyRefundRequest(input: { id: string; email: string; amountMicros: number; reason: string | null }) {
  const amount = `USD ${(input.amountMicros / 1_000_000).toFixed(2)}`;
  const ref = input.id.slice(0, 8).toUpperCase();
  await sendEmail({
    to: COMPANY.email,
    subject: `[refund] #${ref} ${amount} — ${input.email}`,
    text: `Refund request #${ref} (${input.id})\nAccount: ${input.email}\nAmount (held): ${amount}\nReason: ${input.reason ?? "—"}\n\nProcess within 10 business days: refund to the original payment method, then run scripts/refund.mjs approve ${input.id}`,
    html: `<p>Refund request <b>#${ref}</b> (${escapeHtml(input.id)})<br>Account: ${escapeHtml(input.email)}<br>Amount (held): <b>${amount}</b><br>Reason: ${escapeHtml(input.reason ?? "—")}</p>`,
  });
  const text = [
    `We have received your request to refund your unused ${BRAND} balance.`,
    "",
    `Request: #${ref}`,
    `Amount: ${amount}`,
    "",
    "This amount is now on hold and can't be spent while we process the request. We refund to the original payment method within 10 business days of approval. We may ask you to confirm the request from this email address.",
    "",
    `Questions: ${COMPANY.email}. ${COMPANY.legalName}, ${COMPANY.address}.`,
  ].join("\n");
  await sendEmail({
    to: input.email,
    subject: `${BRAND}: refund request #${ref} received`,
    text,
    html: `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111;max-width:560px">${text
      .split("\n\n")
      .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
      .join("")}</div>`,
  });
}
